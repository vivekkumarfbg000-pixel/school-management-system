import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/dashboard/stats
router.get('/stats', protect, asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const today = new Date().toISOString().split('T')[0];

  // ── Parallelize all independent queries with Promise.allSettled ──
  const [
    studentCountResult,
    staffCountResult,
    enrollmentResult,
    attendanceResult,
    feeWeeksResult,
    recentActivityResult,
    pendingFeesResult,
    overdueResult,
    todayEventsResult
  ] = await Promise.allSettled([
    // 1. Student count
    supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'Active'),

    // 2. Staff count
    supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'Active'),

    // 3. Enrollment velocity (last 6 months)
    (async () => {
      const months = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const monthName = d.toLocaleString('default', { month: 'short' });
        const start = new Date(d.getFullYear(), d.getMonth(), 1).toISOString();
        const end = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59).toISOString();
        
        const { count } = await supabase
          .from('students')
          .select('*', { count: 'exact', head: true })
          .eq('school_id', schoolId)
          .gte('created_at', start)
          .lte('created_at', end);
        
        months.push({ name: monthName, students: count || 0 });
      }
      return months;
    })(),

    // 4. Attendance distribution (today)
    supabase
      .from('attendance')
      .select('status, students!inner(school_id)')
      .eq('date', today)
      .eq('students.school_id', schoolId),

    // 5. Fee collection (weekly bar chart)
    (async () => {
      const weeks = [];
      for (let i = 3; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - (i * 7));
        const start = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay()).toISOString();
        const end = new Date(d.getFullYear(), d.getMonth(), d.getDate() - d.getDay() + 6).toISOString();
        
        const { data: weekFees } = await supabase
          .from('fees')
          .select('amount, students!inner(school_id)')
          .eq('status', 'Paid')
          .eq('students.school_id', schoolId)
          .gte('paid_date', start)
          .lte('paid_date', end);
        
        const total = weekFees?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;
        weeks.push({ name: `W${4-i}`, collected: total });
      }
      return weeks;
    })(),

    // 6. Recent activity (last 5 admissions)
    supabase
      .from('students')
      .select('name, class_name, section, created_at')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(5),

    // 7. Pending fees count
    supabase
      .from('fees')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Pending')
      .eq('students.school_id', schoolId),

    // 8. Overdue library books
    supabase
      .from('book_issues')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'Issued')
      .lt('due_date', new Date().toISOString()),

    // 9. Today's timetable events
    (async () => {
      const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      const todayDay = dayNames[new Date().getDay()];
      const { data } = await supabase
        .from('timetable_slots')
        .select('subject, class_name, section, start_time, end_time, teacher_name')
        .eq('school_id', schoolId)
        .eq('day', todayDay)
        .order('start_time', { ascending: true })
        .limit(6);
      return data || [];
    })()
  ]);

  // ── Extract results safely ──
  const safeValue = (result, accessor) => {
    if (result.status === 'fulfilled') {
      return typeof accessor === 'function' ? accessor(result.value) : result.value;
    }
    return null;
  };

  const studentCount = safeValue(studentCountResult, r => r.count) || 0;
  const staffCount = safeValue(staffCountResult, r => r.count) || 0;
  const enrollmentMonths = safeValue(enrollmentResult) || [];
  const attDataRaw = safeValue(attendanceResult, r => r.data) || [];
  const feeWeeks = safeValue(feeWeeksResult) || [];
  const recentActivity = safeValue(recentActivityResult, r => r.data) || [];
  const pendingFeesCount = safeValue(pendingFeesResult, r => r.count) || 0;
  const overdueBooks = safeValue(overdueResult, r => r.count) || 0;
  const todayEvents = safeValue(todayEventsResult) || [];

  // ── Compute attendance distribution ──
  const dist = { PRESENT: 0, ABSENT: 0, LATE: 0 };
  attDataRaw.forEach(a => { if (dist[a.status] !== undefined) dist[a.status]++; });
  
  const totalAtt = attDataRaw.length || 0;
  const attendanceRate = totalAtt > 0 ? Math.round((dist.PRESENT / totalAtt) * 100) : 0;
  const attendanceDistribution = [
    { name: 'Present', value: totalAtt > 0 ? Math.round((dist.PRESENT / totalAtt) * 100) : 0, color: 'var(--success)' },
    { name: 'Absent', value: totalAtt > 0 ? Math.round((dist.ABSENT / totalAtt) * 100) : 0, color: 'var(--danger)' },
    { name: 'Late', value: totalAtt > 0 ? Math.round((dist.LATE / totalAtt) * 100) : 0, color: 'var(--warning)' }
  ];

  const monthlyRevenue = feeWeeks.reduce((a, b) => a + b.collected, 0);

  // ── Send response ──
  res.json({
    stats: {
      totalStudents: studentCount,
      totalStaff: staffCount,
      attendanceRate,
      attendanceToday: `${attendanceRate}%`,
      monthlyRevenue,
      pendingFees: pendingFeesCount,
      overdueBooks
    },
    charts: {
      enrollment: enrollmentMonths,
      attendance: attendanceDistribution,
      revenue: feeWeeks
    },
    activity: recentActivity?.map(s => ({
      title: `New Admission: ${s.name}`,
      desc: `Joined Class ${s.class_name}-${s.section}`,
      time: s.created_at
    })) || [],
    todayEvents: todayEvents.map(e => ({
      subject: e.subject,
      class: `${e.class_name}-${e.section}`,
      time: `${e.start_time} - ${e.end_time}`,
      teacher: e.teacher_name || 'TBA'
    })),
    pendingTasks: {
      unpaidFees: pendingFeesCount,
      overdueBooks,
      total: pendingFeesCount + overdueBooks
    }
  });
}));

export default router;
