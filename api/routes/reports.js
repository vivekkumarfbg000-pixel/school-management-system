import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/reports/overview — Aggregate KPIs from real data
router.get('/overview', protect, asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;

  // 1. Overall Attendance %
  const { data: attendanceStats, error: aErr } = await supabase
    .from('attendance')
    .select('status, students!inner(school_id)')
    .eq('students.school_id', schoolId);

  let attendancePct = 0;
  if (!aErr && attendanceStats && attendanceStats.length > 0) {
    const present = attendanceStats.filter(a => a.status === 'Present' || a.status === 'Late').length;
    attendancePct = Math.round((present / attendanceStats.length) * 100 * 10) / 10;
  }

  // 2. Fee Collection Rate %
  const { data: feeStats, error: fErr } = await supabase
    .from('fees')
    .select('amount, paid_amount, late_fee, students!inner(school_id)')
    .eq('students.school_id', schoolId);

  let feeCollectionRate = 0;
  if (!fErr && feeStats && feeStats.length > 0) {
    const totalDue = feeStats.reduce((a, f) => a + f.amount + (f.late_fee || 0), 0);
    const totalPaid = feeStats.reduce((a, f) => a + f.paid_amount, 0);
    feeCollectionRate = totalDue > 0 ? Math.round((totalPaid / totalDue) * 100 * 10) / 10 : 0;
  }

  // 3. Exam Pass Rate %
  const { data: marks, error: mErr } = await supabase
    .from('exam_marks')
    .select('obtained, max_marks, students!inner(school_id)')
    .eq('students.school_id', schoolId);

  let passRate = 0;
  if (!mErr && marks && marks.length > 0) {
    const passed = marks.filter(m => (m.obtained / m.max_marks) >= 0.33).length;
    passRate = Math.round((passed / marks.length) * 100 * 10) / 10;
  }

  // 4. Staff count
  const { data: staff, error: sErr } = await supabase
    .from('staff')
    .select('id')
    .eq('school_id', schoolId);

  const staffCount = (!sErr && staff) ? staff.length : 0;

  // 5. Student count
  const { data: students, error: stErr } = await supabase
    .from('students')
    .select('id')
    .eq('school_id', schoolId)
    .eq('status', 'Active');

  const studentCount = (!stErr && students) ? students.length : 0;

  res.json({
    attendanceRate: attendancePct,
    feeCollectionRate,
    examPassRate: passRate,
    staffCount,
    studentCount,
  });
}));

export default router;
