const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { protect, authorize } = require('../middleware/auth');

// GET /api/staff
router.get('/', protect, authorize('ADMIN', 'PRINCIPAL'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('*')
      .eq('school_id', req.user.schoolId)
      .order('name');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error retrieving staff' });
  }
});

// POST /api/staff
router.post('/', protect, authorize('ADMIN'), async (req, res) => {
  try {
    const { 
      staffId, name, designation, type, qualification, phone, 
      basicSalary, subjects, joiningDate 
    } = req.body;

    const { data, error } = await supabase
      .from('staff')
      .insert([{
        staff_id: staffId,
        name,
        designation,
        type,
        qualification,
        phone,
        basic_salary: parseFloat(basicSalary),
        subjects,
        joining_date: joiningDate,
        school_id: req.user.schoolId
      }])
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating staff' });
  }
});

// DELETE /api/staff/:id
router.delete('/:id', protect, async (req, res) => {
  try {
    const { error } = await supabase
      .from('staff')
      .update({ status: 'Inactive' })
      .eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Staff record updated to inactive' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
