const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { protect, authorize } = require('../middleware/auth');

// GET /api/students
router.get('/', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', req.user.schoolId)
      .order('name');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving students' });
  }
});

// POST /api/students
router.post('/', protect, authorize('ADMIN', 'PRINCIPAL'), async (req, res) => {
  try {
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
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating student' });
  }
});

// GET /api/students/:id
router.get('/:id', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*, attendance(*), fees(*), exam_marks(*)')
      .eq('id', req.params.id)
      .single();
    if (error || !data) return res.status(404).json({ message: 'Student not found' });
    if (data.school_id !== req.user.schoolId) return res.status(403).json({ message: 'Forbidden' });
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE /api/students/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('students')
      .update({ status: 'Deleted' })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Student removed successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
