import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

router.post('/students', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { students } = req.body;
  if (!Array.isArray(students)) return res.status(400).json({ message: 'students array required' });
  const records = students.map(s => ({ ...s, school_id: req.user.schoolId }));
  const { data, error } = await supabase.from('students').insert(records).select();
  if (error) throw error;
  res.status(201).json({ message: `Imported ${data.length} students`, data });
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
