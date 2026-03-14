const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { protect, authorize } = require('../middleware/auth');

// GET /api/academics/exams
router.get('/exams', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('date', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET /api/academics/marks/:studentId
router.get('/marks/:studentId', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('exam_marks')
      .select('*, exams(name)')
      .eq('student_id', req.params.studentId);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST /api/academics/exams
router.post('/exams', protect, authorize('ADMIN', 'PRINCIPAL'), async (req, res) => {
  try {
    const { name, date, className } = req.body;
    const { data, error } = await supabase
      .from('exams')
      .insert([{ name, date, class_name: className }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating exam' });
  }
});

module.exports = router;
