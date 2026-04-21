/**
 * WhatsApp Provider — Meta Cloud API (Long-term Best Option)
 * 
 * Why Meta Cloud API:
 * - FREE per conversation (24-hr window: unlimited messages)
 * - No middleman markup (unlike Interakt/Wati which charge ₹2-10K/mo)
 * - Direct integration = full control over delivery, templates, webhooks
 * - Scalable to millions of messages
 * 
 * Setup required:
 * 1. Create Meta Business Account at business.facebook.com
 * 2. Add WhatsApp Business API product
 * 3. Get Phone Number ID + Access Token from Meta Developer Console
 * 4. Submit message templates for approval (24-48 hrs)
 * 5. Add WHATSAPP_TOKEN and WHATSAPP_PHONE_ID to .env
 */

import axios from 'axios';

const META_API_URL = 'https://graph.facebook.com/v21.0';
const PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_ID;
const ACCESS_TOKEN = process.env.WHATSAPP_TOKEN;

const isMock = !PHONE_NUMBER_ID || !ACCESS_TOKEN || process.env.WHATSAPP_MOCK === 'true';

/**
 * Send a free-form text message (only within 24-hr customer service window)
 */
export const sendWhatsAppMessage = async (toPhone, message) => {
  const phone = toPhone.replace(/\D/g, '');
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

  if (isMock) {
    console.log(`\n📱 [WhatsApp MOCK] To: +${formattedPhone}`);
    console.log(`   Message: "${message.substring(0, 80)}..."`);
    return { success: true, messageId: `mock_wa_${Date.now()}` };
  }

  try {
    const response = await axios.post(
      `${META_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: formattedPhone,
        type: 'text',
        text: { preview_url: false, body: message }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (error) {
    console.error('[WhatsApp] Send failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
};

/**
 * Send a pre-approved template message (works ANY time, not just 24-hr window)
 * Templates must be approved in Meta Business Manager before use.
 * 
 * @param {string} toPhone - recipient phone number
 * @param {string} templateName - approved template name (snake_case)
 * @param {string} langCode - 'en' or 'en_US'
 * @param {Array} components - array of header/body/button components with parameters
 */
export const sendWhatsAppTemplate = async (toPhone, templateName, langCode = 'en', components = []) => {
  const phone = toPhone.replace(/\D/g, '');
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

  if (isMock) {
    console.log(`\n📱 [WhatsApp TEMPLATE MOCK] To: +${formattedPhone}`);
    console.log(`   Template: ${templateName}`);
    console.log(`   Components:`, JSON.stringify(components, null, 2));
    return { success: true, messageId: `mock_tpl_${Date.now()}` };
  }

  try {
    const response = await axios.post(
      `${META_API_URL}/${PHONE_NUMBER_ID}/messages`,
      {
        messaging_product: 'whatsapp',
        to: formattedPhone,
        type: 'template',
        template: { name: templateName, language: { code: langCode }, components }
      },
      {
        headers: {
          Authorization: `Bearer ${ACCESS_TOKEN}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return { success: true, messageId: response.data.messages?.[0]?.id };
  } catch (error) {
    console.error('[WhatsApp Template] Send failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.error?.message || error.message };
  }
};

/**
 * Broadcast message to multiple recipients
 * Meta API requires individual calls per recipient (no bulk endpoint)
 * Uses Promise.allSettled to prevent one failure from blocking others
 */
export const sendWhatsAppBroadcast = async (phones, message) => {
  if (isMock) {
    console.log(`\n💬 [WhatsApp BROADCAST MOCK] Audience: ${phones.length}`);
    console.log(`   Preview: "${message.substring(0, 60)}..."`);
    return { success: true, delivered: phones.length, failed: 0, batchId: `mock_batch_${Date.now()}` };
  }

  const results = await Promise.allSettled(
    phones.map(phone => sendWhatsAppMessage(phone, message))
  );

  const delivered = results.filter(r => r.status === 'fulfilled' && r.value?.success).length;
  const failed = results.length - delivered;

  return { success: true, delivered, failed, total: phones.length, batchId: `batch_${Date.now()}` };
};

// ────────────────────────────────────────────
// Pre-built EduStream message builders
// These build the message text — templates 
// should mirror these in Meta Business Manager
// ────────────────────────────────────────────

export const buildAbsentAlert = (studentName, className, schoolName, date = new Date()) => {
  const dateStr = date.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });
  return `🏫 *${schoolName}*

Dear Parent,

This is to inform you that *${studentName}* (Class ${className}) was marked *ABSENT* today, ${dateStr}.

If this is a mistake or you have already informed the school, please contact us.

— EduStream School Management`;
};

export const buildFeeReminder = (studentName, amount, dueDate, feeType, paymentLink, schoolName) => {
  const dueDateStr = new Date(dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
  const linkSection = paymentLink ? `\n💳 *Pay Online:* ${paymentLink}` : '';
  return `🏫 *${schoolName}*

Dear Parent of *${studentName}*,

This is a friendly reminder that your *${feeType} Fee* of *₹${amount.toLocaleString('en-IN')}* is due on *${dueDateStr}*.${linkSection}

Please pay at the school counter or use the link above to avoid a late fee.

Thank you 🙏`;
};

export const buildFeeOverdue = (studentName, amount, daysPast, paymentLink, schoolName) => {
  const linkSection = paymentLink ? `\n💳 *Pay Now:* ${paymentLink}` : '';
  return `⚠️ *${schoolName} — Payment Overdue*

Dear Parent of *${studentName}*,

Your fee payment of *₹${amount.toLocaleString('en-IN')}* is *${daysPast} days overdue*.

Late fees may apply. Please clear the dues at your earliest convenience.${linkSection}

For queries, contact the school office.`;
};

export const buildFeeReceipt = (studentName, amount, receiptNo, feeType, schoolName) => {
  return `✅ *Payment Received — ${schoolName}*

Dear Parent,

We acknowledge receipt of *₹${amount.toLocaleString('en-IN')}* for *${studentName}*'s ${feeType} fee.

🧾 *Receipt No:* ${receiptNo}
📅 *Date:* ${new Date().toLocaleDateString('en-IN')}

Thank you for the timely payment! 🙏`;
};

export const buildExamNotice = (className, examName, startDate, schoolName) => {
  const dateStr = new Date(startDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' });
  return `📝 *Exam Schedule — ${schoolName}*

Dear Parent,

*${examName}* for Class *${className}* begins on *${dateStr}*.

Please ensure your child is well-prepared and carries all required stationery.

— Administration`;
};
