const express = require('express');
const router = express.Router();
const supabase = require('../utils/supabaseClient');
const { protect } = require('../middleware/auth');

// GET /api/dashboard/stats
router.get('/stats', protect, async (req, res) => {
  try {
    const schoolId = req.user.schoolId;

    // 1. Total Students
    const { count: studentCount, error: sErr } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'Active');
    
    // 2. Total Staff
    const { count: staffCount, error: stErr } = await supabase
      .from('staff')
      .select('*', { count: 'exact', head: true })
      .eq('school_id', schoolId)
      .eq('status', 'Active');

    // 3. Today's Attendance
    const today = new Date().toISOString().split('T')[0];
    const { data: attendance, error: aErr } = await supabase
      .from('attendance')
      .select('status')
      .eq('date', today);
    
    const presentCount = attendance?.filter(a => a.status === 'PRESENT').length || 0;
    const totalMarked = attendance?.length || 0;
    const attendanceRate = totalMarked > 0 ? Math.round((presentCount / totalMarked) * 100) : 0;

    // 4. Monthly Revenue (Paid Fees)
    const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
    const { data: fees, error: fErr } = await supabase
      .from('fees')
      .select('amount')
      .eq('status', 'Paid')
      .gte('payment_date', startOfMonth);
    
    const monthlyRevenue = fees?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;

    // 5. Recent Activity (Students)
    const { data: recentStudents } = await supabase
      .from('students')
      .select('id, name, class_name, section, created_at')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false })
      .limit(5);

    res.json({
      stats: {
        totalStudents: studentCount || 0,
        totalStaff: staffCount || 0,
        attendanceRate: attendanceRate,
        monthlyRevenue: monthlyRevenue
      },
      recentStudents: recentStudents || []
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching dashboard stats' });
  }
});

module.exports = router;
