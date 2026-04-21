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

// GET /api/academics/stats
router.get('/stats', protect, asyncHandler(async (req, res) => {
  const { data: marks, error } = await supabase
    .from('exam_marks')
    .select('subject, obtained, max_marks, students!inner(school_id)')
    .eq('students.school_id', req.user.schoolId);
  
  if (error) throw error;

  // Group by subject
  const stats = {};
  marks.forEach(m => {
    if (!stats[m.subject]) stats[m.subject] = { totalObtained: 0, totalMax: 0, count: 0, passCount: 0 };
    stats[m.subject].totalObtained += m.obtained;
    stats[m.subject].totalMax += m.max_marks;
    stats[m.subject].count++;
    if ((m.obtained / m.max_marks) >= 0.33) stats[m.subject].passCount++;
  });

  const result = Object.keys(stats).map(subject => ({
    subject,
    avg: Math.round((stats[subject].totalObtained / (stats[subject].count || 1))),
    passRate: Math.round((stats[subject].passCount / (stats[subject].count || 1)) * 100)
  }));

  res.json(result);
}));

// GET /api/academics/toppers
router.get('/toppers', protect, asyncHandler(async (req, res) => {
  const { data: toppers, error } = await supabase
    .from('exam_marks')
    .select('obtained, max_marks, student_id, students(name, class_name, section)')
    .eq('students.school_id', req.user.schoolId)
    .order('obtained', { ascending: false })
    .limit(5);

  if (error) throw error;
  res.json(toppers);
}));

// POST /api/academics/marks
router.post('/marks', protect, authorize('ADMIN', 'PRINCIPAL', 'STAFF'), asyncHandler(async (req, res) => {
  const { marks } = req.body; 
  
  if (!Array.isArray(marks) || marks.length === 0) {
    return res.status(400).json({ message: 'Marks array is required' });
  }

  const { data, error } = await supabase
    .from('exam_marks')
    .insert(marks)
    .select();

  if (error) throw error;
  res.status(201).json(data);
}));

export default router;
