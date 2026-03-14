const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { protect } = require('../middleware/auth');

// GET /api/transport/vehicles
router.get('/vehicles', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('vehicles')
      .select('*')
      .eq('school_id', req.user.schoolId);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
