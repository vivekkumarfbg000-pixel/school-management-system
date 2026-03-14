const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { protect, authorize } = require('../middleware/auth');

// GET /api/payroll/slips
router.get('/slips', protect, authorize('ADMIN', 'ACCOUNTANT'), async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('salary_slips')
      .select('*, staff(name, designation)')
      .order('month', { ascending: false });
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
