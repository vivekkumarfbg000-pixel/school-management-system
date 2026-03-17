import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import { sendSMS } from '../utils/smsProvider.js';
import asyncHandler from '../utils/asyncHandler.js';

// POST /api/notifications/broadcast
// Send a manual SMS to a specific class or everyone
router.post('/broadcast', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { target, className, section, message } = req.body;

  if (!message) return res.status(400).json({ message: 'Message is required' });

  let query = supabase.from('students').select('phone').eq('status', 'Active');

  if (target === 'class') {
    if (!className) return res.status(400).json({ message: 'Class name is required' });
    query = query.eq('class_name', className);
    if (section) query = query.eq('section', section);
  }

  const { data: students, error } = await query;
  if (error) throw error;

  if (!students || students.length === 0) {
    return res.status(404).json({ message: 'No students found for target' });
  }

  // Broadcast in background
  let sentCount = 0;
  for (const student of students) {
      if (student.phone) {
          await sendSMS(student.phone, message);
          sentCount++;
      }
  }

  res.json({ message: `Broadcast successful. sent to ${sentCount} recipients.` });
}));

// GET /api/notifications/notices
router.get('/notices', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .eq('school_id', req.user.schoolId)
    .order('created_at', { ascending: false });
  
  if (error) throw error;
  res.json(data);
}));

// POST /api/notifications/notices
router.post('/notices', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { title, content, priority, audience, icon } = req.body;
  
  const { data, error } = await supabase
    .from('notices')
    .insert([{
      title,
      content,
      priority: priority || 'Medium',
      audience: audience || 'All',
      icon: icon || '📢',
      school_id: req.user.schoolId
    }])
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(data);
}));

export default router;
