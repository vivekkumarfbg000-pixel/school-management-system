import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendSMS } from '../utils/smsProvider.js';
import { sendWhatsAppMessage, buildFeeReceipt } from '../utils/whatsappProvider.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/fees — returns all students with their fee summaries
router.get('/', protect, authorize('ADMIN', 'PRINCIPAL', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const { data: students, error } = await supabase
    .from('students')
    .select('*, fees(*)')
    .eq('school_id', req.user.schoolId)
    .order('name');
  if (error) throw error;

  const financeData = students.map(student => {
    let totalDue = 0, totalPaid = 0;
    let status = student.fees.length === 0 ? 'N/A' : 'Paid';
    if (student.is_rte) status = 'RTE';

    student.fees.forEach(fee => {
      totalDue += fee.amount + fee.late_fee;
      totalPaid += fee.paid_amount;
      if (!student.is_rte) {
        if (fee.status === 'Overdue') status = 'Overdue';
        else if (fee.status === 'Pending' && status !== 'Overdue') status = 'Pending';
        else if (fee.status === 'Partial' && !['Overdue', 'Pending'].includes(status)) status = 'Partial';
      }
    });

    return {
      id: student.id,
      admissionNo: student.admission_no,
      name: student.name,
      className: student.class_name,
      section: student.section,
      phone: student.phone,
      isRTE: student.is_rte,
      totalDue,
      totalPaid,
      balance: totalDue - totalPaid,
      status,
      fees: student.fees
    };
  });

  res.json(financeData);
}));

// POST /api/fees/collect
router.post('/collect', protect, authorize('ADMIN', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const { studentId, feeType, amountPaid, isFullPayment } = req.body;

  const { data: fees, error } = await supabase
    .from('fees')
    .select('*')
    .eq('student_id', studentId)
    .eq('fee_type', feeType)
    .in('status', ['Pending', 'Overdue', 'Partial'])
    .order('due_date')
    .limit(1);

  if (error) throw error;
  if (!fees || fees.length === 0) return res.status(404).json({ message: 'No pending fee found for this type' });

  const feeRecord = fees[0];
  const totalDue = feeRecord.amount + feeRecord.late_fee;
  const newPaidAmount = feeRecord.paid_amount + parseFloat(amountPaid);
  const newStatus = (newPaidAmount >= totalDue || isFullPayment) ? 'Paid' : 'Partial';
  const receiptNo = `REC-${Date.now().toString().slice(-6)}`;

  const { data: updated, error: uErr } = await supabase
    .from('fees')
    .update({ paid_amount: newPaidAmount, status: newStatus, paid_date: new Date().toISOString(), receipt_no: receiptNo })
    .eq('id', feeRecord.id)
    .select()
    .single();
  if (uErr) throw uErr;

  // Trigger WhatsApp Receipt
  try {
    const { data: student } = await supabase.from('students').select('name, phone').eq('id', studentId).single();
    if (student && student.phone) {
      const receiptMessage = buildFeeReceipt(student.name, amountPaid, receiptNo, feeType, "EduStream School");
      await sendWhatsAppMessage(student.phone, receiptMessage);
    }
  } catch (waErr) {
    console.error("WhatsApp receipt failed", waErr);
  }

  res.json({ message: 'Payment collected successfully', receiptNo, fee: updated });
}));

// POST /api/fees/generate
router.post('/generate', protect, authorize('ADMIN', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const { studentId, amount, feeType, dueDate } = req.body;
  const { data, error } = await supabase.from('fees').insert([{
    amount: parseFloat(amount),
    fee_type: feeType,
    due_date: dueDate,
    status: 'Pending',
    student_id: studentId
  }]).select().single();
  if (error) throw error;

  // Trigger SMS for Fee Billing
  try {
    const { data: student } = await supabase.from('students').select('phone').eq('id', studentId).single();
    if (student && student.phone) {
      const msg = `Dear Parent, a new fee bill (₹${amount}) has been generated for your child. Due date: ${dueDate}. Please pay timely to avoid late fees.`;
      sendSMS(student.phone, msg);
    }
  } catch (smsErr) {
    console.error("SMS notification failed", smsErr);
  }

  res.status(201).json(data);
}));

export default router;
