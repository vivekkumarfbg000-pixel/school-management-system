import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';
import { generateTimetable } from '../utils/timetableEngine.js';

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

// POST /api/timetable/auto-generate
router.post('/auto-generate', protect, async (req, res) => {
  try {
    const { className, section, subjectConfig } = req.body;
    if (!className || !section || !subjectConfig) {
      return res.status(400).json({ message: 'Missing parameters for algorithmic generation' });
    }

    const newSlots = await generateTimetable(req.user.schoolId, className, section, subjectConfig);
    res.json({ message: `Successfully generated ${newSlots.length} clash-free slots.`, slots: newSlots });
  } catch (error) {
    console.error('[TimetableEngine Error]:', error);
    res.status(500).json({ message: 'Engine failed to compute non-conflicting slots. Consider adding more staff or tweaking subjects.' });
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
