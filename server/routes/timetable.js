const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { protect } = require('../middleware/auth');

// GET /api/timetable
router.get('/', protect, async (req, res) => {
  try {
    const { className, section } = req.query;
    let query = supabase.from('timetable_slots').select('*, staff(name)');
    
    if (className) query = query.eq('class_name', className);
    if (section) query = query.eq('section', section);

    const { data, error } = await query.order('period');
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
