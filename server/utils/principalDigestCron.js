import supabase from './supabaseClient.js';
import { sendWhatsAppMessage } from './whatsappProvider.js';

/**
 * Daily Principal Digest
 * Sends a WhatsApp summary of today's collections and pending fees at 8 PM.
 */
export async function runPrincipalDigestCron() {
  console.log(`\n📊 [Principal Digest Cron] Starting at ${new Date().toISOString()}`);

  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  const startOfMonthStr = startOfMonth.toISOString().split('T')[0];

  // 1. Get all schools
  const { data: schools, error: schoolErr } = await supabase.from('schools').select('id, name, whatsapp_enabled');
  if (schoolErr) {
    console.error('[Principal Digest Cron] Failed to fetch schools:', schoolErr);
    return;
  }

  for (const school of schools) {
    if (!school.whatsapp_enabled) continue;

    // 2. Find Principal's phone number
    const { data: principals } = await supabase
      .from('users')
      .select('phone, name')
      .eq('school_id', school.id)
      .eq('role', 'PRINCIPAL')
      .limit(1);
    
    const principal = principals?.[0];
    if (!principal || !principal.phone) {
       console.log(`[Principal Digest Cron] No principal phone found for school ${school.name}`);
       continue;
    }

    // 3. Calculate today's collection
    const { data: todayFees } = await supabase
      .from('fees')
      .select('paid_amount, students!inner(school_id)')
      .eq('students.school_id', school.id)
      .eq('status', 'Paid') // Could also include 'Partial' but assuming Paid for simplicity
      .gte('paid_date', today);

    const todayCollection = todayFees?.reduce((sum, f) => sum + (f.paid_amount || 0), 0) || 0;
    const todayStudentCount = todayFees?.length || 0;

    // 3.5 Calculate today's expenses
    const { data: todayExp } = await supabase
      .from('expenses')
      .select('amount')
      .eq('school_id', school.id)
      .eq('date', today);
      
    const todayExpenses = todayExp?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;
    const netCash = todayCollection - todayExpenses;

    // 4. Calculate month's collection
    const { data: monthFees } = await supabase
      .from('fees')
      .select('paid_amount, students!inner(school_id)')
      .eq('students.school_id', school.id)
      .in('status', ['Paid', 'Partial'])
      .gte('paid_date', startOfMonthStr);
    
    const monthCollection = monthFees?.reduce((sum, f) => sum + (f.paid_amount || 0), 0) || 0;

    // 5. Calculate pending fees
    const { data: pendingFees } = await supabase
      .from('fees')
      .select('amount, paid_amount, students!inner(school_id)')
      .eq('students.school_id', school.id)
      .in('status', ['Pending', 'Partial', 'Overdue']);
    
    const pendingTotal = pendingFees?.reduce((sum, f) => sum + (f.amount - (f.paid_amount || 0)), 0) || 0;
    const pendingCount = pendingFees?.length || 0;

    // Build the digest message
    const message = `📊 *Daily Report — ${new Date().toLocaleDateString('en-IN')}*
🏫 *${school.name}*

*Today's Drawer:*
- Collected: ₹${todayCollection.toLocaleString('en-IN')} (${todayStudentCount} students)
- Expenses: ₹${todayExpenses.toLocaleString('en-IN')}
- *Net Cash: ₹${netCash.toLocaleString('en-IN')}*

*This Month So Far:* ₹${monthCollection.toLocaleString('en-IN')}

⚠️ *Still Pending:*
- Amount: ₹${pendingTotal.toLocaleString('en-IN')}
- Students: ${pendingCount}

Type REPORT to see the pending list.`;

    // Send WhatsApp
    await sendWhatsAppMessage(principal.phone, message);
    console.log(`[Principal Digest Cron] Sent digest to ${school.name} (${principal.phone})`);
  }
}
