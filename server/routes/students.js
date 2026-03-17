import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/students
router.get('/', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', req.user.schoolId)
    .order('name');
  if (error) throw error;
  res.json(data);
}));

// POST /api/students
router.post('/', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { admissionNo, name, fatherName, motherName, className, section, dob, gender, category, phone, address } = req.body;

  const { data: existing } = await supabase.from('students').select('id').eq('admission_no', admissionNo).single();
  if (existing) return res.status(400).json({ message: 'Student with this admission number already exists' });

  const { data, error } = await supabase.from('students').insert([{
    admission_no: admissionNo,
    name,
    father_name: fatherName,
    mother_name: motherName,
    class_name: className,
    section,
    dob,
    gender,
    category,
    phone,
    address,
    school_id: req.user.schoolId
  }]).select().single();
  
  if (error) throw error;

  // --- SMART INTERCONNECTION: Initialize Fee Ledger ---
  // 1. Fetch Fee Structure for this class
  const { data: structures } = await supabase
    .from('fee_structures')
    .select('*')
    .eq('class_name', className)
    .eq('school_id', req.user.schoolId);

  if (structures && structures.length > 0) {
    const feeRecords = structures.map(fs => ({
      student_id: data.id,
      amount: fs.amount,
      fee_type: fs.fee_type,
      status: 'Pending',
      due_date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 10).toISOString(), // Due 10th of next month
    }));

    await supabase.from('fees').insert(feeRecords);
  }

  res.status(201).json(data);
}));

// GET /api/students/:id
router.get('/:id', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('students')
    .select('*, attendance(*), fees(*), exam_marks(*)')
    .eq('id', req.params.id)
    .single();
  if (error || !data) return res.status(404).json({ message: 'Student not found' });
  if (data.school_id !== req.user.schoolId) return res.status(403).json({ message: 'Forbidden' });
  res.json(data);
}));

// DELETE /api/students/:id
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('students')
    .update({ status: 'Deleted' })
    .eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Student removed successfully' });
}));

export default router;
