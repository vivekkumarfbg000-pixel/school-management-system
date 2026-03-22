import express from 'express';
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/portal/me
 * Sandboxed route that forces the lookup based on the logged-in user's username (admission_no).
 * Returns strict user-level data (Attendance, Fees, Exams) bypassing admin global views.
 */
router.get('/me', protect, async (req, res) => {
  try {
    const admissionNo = req.user.username; // Tied to admission_no in users table
    
    // 1. Fetch exact student profile
    const { data: student, error: studentErr } = await supabase
      .from('students')
      .select('id, name, class_name, section, admission_no, school_id')
      .eq('admission_no', admissionNo)
      .eq('school_id', req.user.schoolId)
      .single();

    if (studentErr || !student) {
      return res.status(404).json({ message: 'Student profile not found for this account.' });
    }

    // 2. Fetch specific attendance records
    const { data: attendance } = await supabase
      .from('attendance')
      .select('date, status')
      .eq('student_id', student.id)
      .order('date', { ascending: false })
      .limit(30);

    // 3. Fetch specific active fees
    const { data: fees } = await supabase
      .from('fees')
      .select('id, amount, paid_amount, status, due_date, fee_type')
      .eq('student_id', student.id)
      .order('due_date', { ascending: false });

    // 4. Fetch specific exam marks
    const { data: marks } = await supabase
      .from('exam_marks')
      .select('subject, max_marks, obtained, grade, exams(name, date)')
      .eq('student_id', student.id);

    // 5. Fetch class timetable
    const { data: timetable } = await supabase
      .from('timetable_slots')
      .select('day, period, subject, start_time, end_time, room, staff(name)')
      .eq('class_name', student.class_name)
      .eq('section', student.section);

    res.json({
        profile: student,
        attendance: attendance || [],
        fees: fees || [],
        marks: marks || [],
        timetable: timetable || []
    });

  } catch (error) {
    console.error('[Portal Endpoint Error]:', error);
    res.status(500).json({ message: 'Failed to aggregate student telemetry.' });
  }
});

export default router;
