import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

router.post('/students', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students)) return res.status(400).json({ message: 'students array required' });
  
  const studentRecords = students.map((s, i) => ({
    school_id: req.user.schoolId,
    admission_no: `ADM-${Date.now().toString().slice(-6)}-${i}`,
    name: s.name,
    class_name: s.class_name,
    section: s.section,
    phone: s.phone,
    status: 'Active'
  }));

  const { data: insertedStudents, error: studentError } = await supabase.from('students').insert(studentRecords).select();
  
  if (studentError) {
    console.error('[Bulk Import Error]', studentError);
    return res.status(400).json({ message: studentError.details || studentError.message || 'Database insert failed' });
  }

  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  const dueDate = new Date();
  dueDate.setDate(10); // due on 10th
  
  const feeRecords = [];
  insertedStudents.forEach((student, index) => {
    const monthlyFee = parseFloat(students[index].monthly_fee) || 0;
    if (monthlyFee > 0) {
      feeRecords.push({
        student_id: student.id,
        amount: monthlyFee,
        fee_type: `Monthly Tuition - ${currentMonth}`,
        due_date: dueDate.toISOString().split('T')[0],
        status: 'Pending',
        paid_amount: 0
      });
    }
  });

  if (feeRecords.length > 0) {
    const { error: feeError } = await supabase.from('fees').insert(feeRecords);
    if (feeError) console.error('[Bulk Import Fee Error]', feeError);
  }

  res.status(201).json({ message: `Imported ${insertedStudents.length} students and generated ledgers`, data: insertedStudents });
}));

router.post('/staff', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { staff } = req.body;
  if (!Array.isArray(staff)) return res.status(400).json({ message: 'staff array required' });
  const records = staff.map(s => ({ ...s, school_id: req.user.schoolId }));
  const { data, error } = await supabase.from('staff').insert(records).select();
  if (error) throw error;
  res.status(201).json({ message: `Imported ${data.length} staff`, data });
}));

export default router;
