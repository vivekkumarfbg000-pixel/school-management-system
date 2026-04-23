import Razorpay from 'razorpay';

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret_123',
});

/**
 * Generate a Razorpay Payment Link
 * @param {number} amount - Amount in INR
 * @param {string} customerName - Name of the parent/student
 * @param {string} customerPhone - Phone number
 * @param {string} referenceId - Internal fee ID to track the payment
 * @param {string} description - Description of the fee
 * @returns {Promise<string>} - The short URL for payment
 */
export async function generatePaymentLink(amount, customerName, customerPhone, referenceId, description) {
  // Mock mode for local dev without keys
  if (!process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_mock123') {
    return `https://rzp.io/i/mock_${referenceId}_${amount}`;
  }

  try {
    const response = await razorpay.paymentLink.create({
      amount: amount * 100, // Amount in paise
      currency: 'INR',
      accept_partial: false,
      description: description,
      customer: {
        name: customerName,
        contact: customerPhone,
      },
      notify: {
        sms: false, // We send our own WhatsApp message
        email: false,
      },
      reminder_enable: false,
      reference_id: referenceId.toString(),
    });

    return response.short_url;
  } catch (error) {
    console.error('[Razorpay] Failed to generate payment link:', error);
    return null;
  }
}
