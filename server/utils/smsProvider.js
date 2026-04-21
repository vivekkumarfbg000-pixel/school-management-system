/**
 * SMS Provider — Msg91 (Best Long-Term Choice for India)
 * 
 * Why Msg91:
 * - India's most reliable DLT-registered SMS provider
 * - Also offers WhatsApp Business API (future convergence)
 * - Competitive pricing: ~₹0.15-0.20 per SMS
 * - DLT template registration portal included
 * - 99.9% uptime SLA
 * - Supports OTP, transactional, promotional routes
 * 
 * Setup:
 * 1. Register at msg91.com
 * 2. Complete DLT registration (mandatory for Indian SMS, takes 2-3 days)
 * 3. Create message templates in DLT portal
 * 4. Add MSG91_AUTH_KEY and MSG91_SENDER_ID to .env
 * 5. Add MSG91_TEMPLATE_IDs for each message type
 */

import axios from 'axios';

const MSG91_BASE = 'https://api.msg91.com/api/v5';
const AUTH_KEY = process.env.MSG91_AUTH_KEY;
const SENDER_ID = process.env.MSG91_SENDER_ID || 'EDUSTR';

const isMock = !AUTH_KEY || process.env.SMS_PROVIDER === 'MOCK';

/**
 * Send a single SMS via Msg91
 * @param {string} phoneNumber - 10-digit Indian mobile
 * @param {string} message - DLT-approved template text
 * @param {string} templateId - DLT Template ID (mandatory for India)
 */
export const sendSMS = async (phoneNumber, message, templateId = '') => {
  const phone = phoneNumber.replace(/\D/g, '');
  const formattedPhone = phone.startsWith('91') ? phone : `91${phone}`;

  if (isMock) {
    console.log(`\n📱 [SMS MOCK] To: +${formattedPhone}`);
    console.log(`   Message: "${message.substring(0, 80)}"`);
    return { success: true, messageId: `mock_sms_${Date.now()}` };
  }

  try {
    const response = await axios.post(
      `${MSG91_BASE}/flow/`,
      {
        template_id: templateId || process.env.MSG91_DEFAULT_TEMPLATE,
        sender: SENDER_ID,
        short_url: '0',
        mobiles: formattedPhone,
        // Replace template variables — Msg91 uses ##VAR## notation
        // Map message into first available variable
        VAR1: message.substring(0, 100),
      },
      {
        headers: {
          authkey: AUTH_KEY,
          'Content-Type': 'application/json',
          accept: 'application/json',
        }
      }
    );
    return { success: true, messageId: response.data?.request_id };
  } catch (error) {
    console.error('[SMS Msg91] Failed:', error.response?.data || error.message);
    return { success: false, error: error.response?.data?.message || error.message };
  }
};

/**
 * Send transactional SMS (for fee receipts, OTPs - highest priority route)
 */
export const sendTransactionalSMS = async (phone, message) => {
  return sendSMS(phone, message, process.env.MSG91_TRANSACTIONAL_TEMPLATE);
};

/**
 * Send absent alert SMS
 */
export const sendAbsentSMS = async (phone, studentName, className) => {
  const message = `Dear Parent, ${studentName} of Cl ${className} was ABSENT today. Please contact school if unexpected. -EduStream`;
  return sendSMS(phone, message, process.env.MSG91_ABSENT_TEMPLATE);
};

/**
 * Send fee reminder SMS
 */
export const sendFeeReminderSMS = async (phone, studentName, amount, dueDate) => {
  const dueDateStr = new Date(dueDate).toLocaleDateString('en-IN');
  const message = `Dear Parent, Fee of Rs.${amount} for ${studentName} is due on ${dueDateStr}. Pay at school or call us. -EduStream`;
  return sendSMS(phone, message, process.env.MSG91_FEE_REMINDER_TEMPLATE);
};

/**
 * Bulk SMS broadcast
 */
export const sendBulkSMS = async (phones, message) => {
  if (isMock) {
    console.log(`\n📡 [SMS BULK MOCK] Audience: ${phones.length} — "${message.substring(0, 60)}..."`);
    return { success: true, delivered: phones.length, failed: 0 };
  }

  const formattedPhones = phones
    .map(p => p.replace(/\D/g, ''))
    .map(p => p.startsWith('91') ? p : `91${p}`)
    .join(',');

  try {
    const response = await axios.post(
      `${MSG91_BASE}/flow/`,
      {
        template_id: process.env.MSG91_BROADCAST_TEMPLATE,
        sender: SENDER_ID,
        mobiles: formattedPhones,
        VAR1: message.substring(0, 100),
      },
      { headers: { authkey: AUTH_KEY, 'Content-Type': 'application/json' } }
    );
    return { success: true, requestId: response.data?.request_id, delivered: phones.length, failed: 0 };
  } catch (error) {
    console.error('[SMS Bulk] Failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};
