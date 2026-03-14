const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { protect, authorize } = require('../middleware/auth');
const { sendSMS } = require('../utils/smsProvider');

// POST /api/notifications/broadcast
// Send a manual SMS to a specific class or everyone
router.post('/broadcast', protect, authorize('ADMIN', 'PRINCIPAL'), async (req, res) => {
  try {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error broadcasting SMS' });
  }
});

module.exports = router;
