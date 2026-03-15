import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/academics/exams
router.get('/exams', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('exams')
    .select('*')
    .order('date', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

// GET /api/academics/marks/:studentId
router.get('/marks/:studentId', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('exam_marks')
    .select('*, exams(name)')
    .eq('student_id', req.params.studentId);
  if (error) throw error;
  res.json(data);
}));

// POST /api/academics/exams
router.post('/exams', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { name, date, className } = req.body;
  const { data, error } = await supabase
    .from('exams')
    .insert([{ name, date, class_name: className }])
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(data);
}));

export default router;
