/**
 * SMS Provider Utility
 * 
 * This utility provides an abstraction for sending SMS messages.
 * It currently supports a MOCK mode for development and can be 
 * extended with Msg91, Fast2SMS, or Twilio.
 */

const sendSMS = async (phoneNumber, message) => {
  const provider = process.env.SMS_PROVIDER || 'MOCK';
  
  console.log(`[SMS ${provider}] Sending to ${phoneNumber}: "${message}"`);

  if (provider === 'MOCK') {
    // In mock mode, we just log to console
    return { success: true, messageId: `mock_${Date.now()}` };
  }

  // Example for future Msg91 Integration
  if (provider === 'MSG91') {
    // const response = await axios.post('msg91_api_url', { 
    //    numbers: phoneNumber, 
    //    message: message, 
    //    authkey: process.env.MSG91_KEY 
    // });
    // return response.data;
  }

  return { success: false, error: 'Provider not configured' };
};

module.exports = { sendSMS };
