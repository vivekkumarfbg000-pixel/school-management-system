import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';

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

export default router;
