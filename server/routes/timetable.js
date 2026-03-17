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

// POST /api/timetable (Upsert Slot)
router.post('/', protect, async (req, res) => {
  try {
    const { day, period, subject, class_name, section, room, staff_id, start_time, end_time } = req.body;
    
    // Check for existing slot to update or insert new
    const { data, error } = await supabase
      .from('timetable_slots')
      .upsert([{
        day, period, subject, class_name, section, room, staff_id, start_time, end_time
      }], { onConflict: 'day,period,class_name,section' })
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update timetable slot' });
  }
});

// GET /api/timetable/staff (For the management modal)
router.get('/staff', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('staff')
      .select('id, name')
      .eq('school_id', req.user.schoolId);
    if (error) throw error;
    res.json(data);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching staff' });
  }
});

export default router;
