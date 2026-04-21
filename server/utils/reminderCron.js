/**
 * Fee Reminder Automation Engine
 * 
 * This is EduStream's #1 revenue-generating feature for schools.
 * Automatically sends WhatsApp + SMS reminders to parents based on fee due dates.
 * 
 * Reminder Timeline:
 *   T-7 days  → Friendly advance notice (WhatsApp)
 *   T-3 days  → Second reminder (WhatsApp + SMS)
 *   T+0 days  → Due today (WhatsApp with payment link)
 *   T+7 days  → First overdue alert (WhatsApp + SMS, urgent tone)
 *   T+15 days → Second overdue alert (WhatsApp + SMS, escalated)
 *   T+30 days → Final warning (WhatsApp + SMS, late fee applied)
 * 
 * Run this as a cron job: every day at 8:00 AM IST
 * 
 * Usage:
 *   import { runFeeReminderCron } from './reminderCron.js';
 *   cron.schedule('0 8 * * *', runFeeReminderCron, { timezone: 'Asia/Kolkata' });
 */

import supabase from './supabaseClient.js';
import {
  sendWhatsAppMessage,
  buildFeeReminder,
  buildFeeOverdue
} from './whatsappProvider.js';
import { sendFeeReminderSMS } from './smsProvider.js';

/**
 * Determine which reminder type applies for a given fee
 */
function getReminderType(dueDate) {
  const now = new Date();
  const due = new Date(dueDate);
  const diffDays = Math.round((due - now) / (1000 * 60 * 60 * 24));

  if (diffDays === 7) return 'pre-due-7';
  if (diffDays === 3) return 'pre-due-3';
  if (diffDays === 0) return 'on-due';
  if (diffDays === -7) return 'overdue-7';
  if (diffDays === -15) return 'overdue-15';
  if (diffDays === -30) return 'overdue-30';
  return null;
}

/**
 * Check if a reminder was already sent for this fee + type combo
 */
async function wasAlreadySent(feeId, reminderType) {
  const { count } = await supabase
    .from('fee_reminders')
    .select('id', { count: 'exact', head: true })
    .eq('fee_id', feeId)
    .eq('type', reminderType);
  return count > 0;
}

/**
 * Log the sent reminder to DB for deduplication + audit
 */
async function logReminder({ feeId, studentId, type, channel, phone, messagePreview, status, messageId }) {
  await supabase.from('fee_reminders').insert({
    fee_id: feeId,
    student_id: studentId,
    type,
    channel,
    phone,
    message_preview: messagePreview?.substring(0, 200),
    status,
    message_id: messageId,
  });

  // Also log in general notifications_log
  await supabase.from('notifications_log').insert({
    type: 'fee_reminder',
    channel,
    recipient_phone: phone,
    message: messagePreview?.substring(0, 200),
    status,
    school_id: '_reminder_cron_', // placeholder — update if needed
    sent_by: 'system',
  });
}

/**
 * Main cron function — run daily at 8 AM IST
 */
export async function runFeeReminderCron() {
  console.log(`\n🔔 [Fee Reminder Cron] Starting at ${new Date().toISOString()}`);

  // Fetch all pending/partial fees with student + school info
  const { data: pendingFees, error } = await supabase
    .from('fees')
    .select(`
      id, amount, paid_amount, due_date, fee_type, payment_link, status,
      students (
        id, name, phone, father_name, class_name, section,
        schools ( id, name, whatsapp_enabled, sms_credits )
      )
    `)
    .in('status', ['Pending', 'Partial', 'Overdue'])
    .not('students', 'is', null);

  if (error) {
    console.error('[Fee Reminder Cron] DB fetch failed:', error);
    return;
  }

  console.log(`[Fee Reminder Cron] Processing ${pendingFees?.length || 0} pending fees`);
  let sent = 0, skipped = 0;

  for (const fee of (pendingFees || [])) {
    const student = fee.students;
    const school = student?.schools;
    if (!student || !school) continue;

    const reminderType = getReminderType(fee.due_date);
    if (!reminderType) { skipped++; continue; }

    const alreadySent = await wasAlreadySent(fee.id, reminderType);
    if (alreadySent) { skipped++; continue; }

    const outstanding = fee.amount - (fee.paid_amount || 0);
    const phone = student.phone;

    // Build message
    const isOverdue = reminderType.startsWith('overdue');
    let message, waResult;

    if (isOverdue) {
      const daysPast = parseInt(reminderType.split('-')[1]) || 7;
      message = buildFeeOverdue(student.name, outstanding, daysPast, fee.payment_link, school.name);
    } else {
      message = buildFeeReminder(
        student.name, outstanding, fee.due_date, fee.fee_type, fee.payment_link, school.name
      );
    }

    // Send WhatsApp (primary)
    if (school.whatsapp_enabled) {
      waResult = await sendWhatsAppMessage(phone, message);
      await logReminder({
        feeId: fee.id,
        studentId: student.id,
        type: reminderType,
        channel: 'whatsapp',
        phone,
        messagePreview: message,
        status: waResult.success ? 'sent' : 'failed',
        messageId: waResult.messageId,
      });
    }

    // Send SMS (secondary, for overdue or if WhatsApp not enabled)
    if (!school.whatsapp_enabled || isOverdue) {
      if ((school.sms_credits || 0) > 0) {
        const smsResult = await sendFeeReminderSMS(phone, student.name, outstanding, fee.due_date);
        await logReminder({
          feeId: fee.id,
          studentId: student.id,
          type: reminderType,
          channel: 'sms',
          phone,
          messagePreview: message,
          status: smsResult.success ? 'sent' : 'failed',
          messageId: smsResult.messageId,
        });
        // Decrement SMS credits
        await supabase
          .from('schools')
          .update({ sms_credits: Math.max(0, (school.sms_credits || 0) - 1) })
          .eq('id', school.id);
      }
    }

    sent++;
  }

  console.log(`[Fee Reminder Cron] Done — Sent: ${sent}, Skipped: ${skipped}`);
  return { sent, skipped };
}

/**
 * Manually trigger reminders for a specific school (for "Send Reminders" button in UI)
 */
export async function triggerRemindersForSchool(schoolId) {
  console.log(`[Fee Reminder] Manual trigger for school: ${schoolId}`);
  
  const { data: pendingFees, error } = await supabase
    .from('fees')
    .select(`
      id, amount, paid_amount, due_date, fee_type, payment_link, status,
      students!inner (
        id, name, phone, father_name, class_name, section,
        schools!inner ( id, name, whatsapp_enabled, sms_credits )
      )
    `)
    .in('status', ['Pending', 'Partial', 'Overdue'])
    .eq('students.school_id', schoolId);

  if (error) return { success: false, error: error.message };

  let results = [];
  for (const fee of (pendingFees || [])) {
    const student = fee.students;
    const school = student?.schools;
    if (!student || !school) continue;

    const outstanding = fee.amount - (fee.paid_amount || 0);
    const isOverdue = new Date(fee.due_date) < new Date();
    
    let message;
    if (isOverdue) {
      const daysPast = Math.round((new Date() - new Date(fee.due_date)) / (1000 * 60 * 60 * 24));
      message = buildFeeOverdue(student.name, outstanding, daysPast, fee.payment_link, school.name);
    } else {
      message = buildFeeReminder(
        student.name, outstanding, fee.due_date, fee.fee_type, fee.payment_link, school.name
      );
    }

    const waResult = await sendWhatsAppMessage(student.phone, message);
    results.push({ studentName: student.name, phone: student.phone, success: waResult.success });
  }

  return { success: true, totalSent: results.filter(r => r.success).length, results };
}
