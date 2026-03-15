import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';
import { sendSMS } from '../utils/smsProvider.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/attendance?className=10&section=A&date=2026-03-14
router.get('/', protect, asyncHandler(async (req, res) => {
  const { className, section, date } = req.query;
  if (!className || !section || !date) {
    return res.status(400).json({ message: 'class, section, and date are required' });
  }

  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('id, name, admission_no')
    .eq('school_id', req.user.schoolId)
    .eq('class_name', className)
    .eq('section', section)
    .eq('status', 'Active')
    .order('name');
  if (sErr) throw sErr;

  if (!students || students.length === 0) return res.json([]);

  const { data: records, error: aErr } = await supabase
    .from('attendance')
    .select('student_id, status')
    .in('student_id', students.map(s => s.id))
    .eq('date', date);
  if (aErr) throw aErr;

  const attMap = {};
  (records || []).forEach(r => { attMap[r.student_id] = r.status; });

  const result = students.map(s => ({ ...s, status: attMap[s.id] || null }));
  res.json(result);
}));

// POST /api/attendance/batch
router.post('/batch', protect, asyncHandler(async (req, res) => {
  const { records, date } = req.body;
  if (!records || !Array.isArray(records) || !date) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const attendanceData = records.map(r => ({
    student_id: r.studentId,
    date,
    status: r.status,
    marked_by: req.user.id
  }));

  const { error: upsertError } = await supabase
    .from('attendance')
    .upsert(attendanceData, { onConflict: 'student_id,date' });
  if (upsertError) throw upsertError;

  // Trigger SMS for Absent Students
  const absentIds = records.filter(r => r.status === 'ABSENT').map(r => r.studentId);
  
  if (absentIds.length > 0) {
    // Fetch phone numbers for absent students
    const { data: studentsWithPhones, error: pErr } = await supabase
      .from('students')
      .select('name, phone')
      .in('id', absentIds);
    
    if (!pErr && studentsWithPhones) {
      for (const student of studentsWithPhones) {
        if (student.phone) {
          const msg = `Dear Parent, your child ${student.name} was marked ABSENT today. Please contact the school office.`;
          await sendSMS(student.phone, msg); 
        }
      }
    }
  }

  res.json({ message: 'Attendance processed successfully' });
}));

export default router;
