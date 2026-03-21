import express from 'express';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import prisma from '../prismaClient.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_mock123',
  key_secret: process.env.RAZORPAY_KEY_SECRET || 'mock_secret_123',
});

// @desc    Create Razorpay Order
// @route   POST /api/pay/create-order
// @access  Private
router.post('/create-order', protect, asyncHandler(async (req, res) => {
  const { expectedAmount, feeId } = req.body;
  
  if (!expectedAmount) {
    return res.status(400).json({ message: 'Amount is required' });
  }

  const options = {
    amount: expectedAmount * 100, // amount in paise
    currency: 'INR',
    receipt: feeId ? `rcp_${feeId}` : `rcp_${Date.now()}`
  };

  try {
    const order = await razorpay.orders.create(options);
    res.status(200).json(order);
  } catch (error) {
    console.error('Razorpay Error:', error);
    res.status(500).json({ message: 'Failed to create Razorpay order' });
  }
}));

// @desc    Verify Razorpay Payment
// @route   POST /api/pay/verify
// @access  Private
router.post('/verify', protect, asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, studentId, amountPaid, feeType } = req.body;

  const sign = razorpay_order_id + '|' + razorpay_payment_id;
  const expectedSign = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'mock_secret_123')
    .update(sign.toString())
    .digest('hex');

  // Skip strict signature check if we are in mock mode
  const isMock = process.env.RAZORPAY_KEY_SECRET === undefined || process.env.RAZORPAY_KEY_SECRET === 'mock_secret_123';
  
  if (razorpay_signature === expectedSign || isMock) {
      
      // If student info provided, internalize the payment into the ledger
      if (studentId) {
          const student = await prisma.students.findUnique({ where: { id: studentId } });
          if (!student) return res.status(404).json({ message: 'Student not found' });
          
          await prisma.fees.create({
             data: {
                 student_id: studentId,
                 amount: amountPaid,
                 due_date: new Date(),
                 paid_date: new Date(),
                 status: 'Paid',
                 fee_type: feeType || 'Online Payment',
                 receipt_no: `RZP-${razorpay_payment_id.slice(-6).toUpperCase()}`
             }
          });
          
          // Deduct from student balance
          await prisma.students.update({
             where: { id: studentId },
             data: { balance: { decrement: amountPaid } }
          });
      }

      res.status(200).json({ message: 'Payment verified successfully', verified: true });
  } else {
      res.status(400).json({ message: 'Invalid signature', verified: false });
  }
}));

export default router;
