import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/dashboard/stats
router.get('/stats', protect, asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;

  // 1. Core Simple Stats (Existing)
  const { count: studentCount } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'Active');
  
  const { count: staffCount } = await supabase
    .from('staff')
    .select('*', { count: 'exact', head: true })
    .eq('school_id', schoolId)
    .eq('status', 'Active');

  // 2. Enrollment Velocity (Last 6 months)
  const enrollmentMonths = [];
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
    
    enrollmentMonths.push({ name: monthName, students: count || 0 });
  }

  // 3. Attendance Pulse (Today's Distribution)
  const today = new Date().toISOString().split('T')[0];
  const { data: attDataRaw } = await supabase
    .from('attendance')
    .select('status, students!inner(school_id)')
    .eq('date', today)
    .eq('students.school_id', schoolId);
  
  const dist = { PRESENT: 0, ABSENT: 0, LATE: 0 };
  (attDataRaw || []).forEach(a => { if (dist[a.status] !== undefined) dist[a.status]++; });
  
  const totalAtt = (attDataRaw?.length || 0);
  const attendanceDistribution = [
    { name: 'Present', value: totalAtt > 0 ? Math.round((dist.PRESENT / totalAtt) * 100) : 0, color: 'var(--success)' },
    { name: 'Absent', value: totalAtt > 0 ? Math.round((dist.ABSENT / totalAtt) * 100) : 0, color: 'var(--danger)' },
    { name: 'Late', value: totalAtt > 0 ? Math.round((dist.LATE / totalAtt) * 100) : 0, color: 'var(--warning)' }
  ];

  // 4. Collection Momentum (Weekly Bar Chart)
  const feeWeeks = [];
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
    feeWeeks.push({ name: `W${4-i}`, collected: total });
  }

  // 5. Recent Operation Feed (Interconnected)
  const { data: recentActivity } = await supabase
    .from('students')
    .select('name, class_name, section, created_at')
    .eq('school_id', schoolId)
    .order('created_at', { ascending: false })
    .limit(4);

  res.json({
    stats: {
      totalStudents: studentCount || 0,
      totalStaff: staffCount || 0,
      attendanceRate: attendanceDistribution[0].value,
      monthlyRevenue: feeWeeks.reduce((a, b) => a + b.collected, 0)
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
    })) || []
  });
}));

export default router;
