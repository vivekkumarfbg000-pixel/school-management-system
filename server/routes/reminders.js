import express from 'express';
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { triggerRemindersForSchool } from '../utils/reminderCron.js';

const router = express.Router();

// GET /reminders/stats — dashboard widget data
router.get('/stats', protect, asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;

  // Fees stats
  const { data: fees } = await supabase
    .from('fees')
    .select('amount, paid_amount, status, due_date, students!inner(school_id)')
    .eq('students.school_id', schoolId);

  const pending = fees?.filter(f => ['Pending', 'Partial', 'Overdue'].includes(f.status)) || [];
  const totalPending = pending.reduce((acc, f) => acc + (f.amount - (f.paid_amount || 0)), 0);
  const overdueCount = pending.filter(f => new Date(f.due_date) < new Date()).length;

  // Reminders sent this month
  const monthStart = new Date();
  monthStart.setDate(1);
  monthStart.setHours(0, 0, 0, 0);

  const { count: remindersSent } = await supabase
    .from('notifications_log')
    .select('id', { count: 'exact', head: true })
    .eq('type', 'fee_reminder')
    .eq('school_id', schoolId)
    .gte('sent_at', monthStart.toISOString());

  // Recovery stat: fees paid after a reminder was sent (approx)
  const { data: recentlyPaid } = await supabase
    .from('fees')
    .select('amount, students!inner(school_id)')
    .eq('status', 'Paid')
    .eq('students.school_id', schoolId)
    .gte('paid_date', monthStart.toISOString());

  const recoveredThisMonth = recentlyPaid?.reduce((acc, f) => acc + f.amount, 0) || 0;

  res.json({
    pendingCount: pending.length,
    totalPending,
    overdueCount,
    remindersSentThisMonth: remindersSent || 0,
    recoveredThisMonth,
  });
}));

// POST /reminders/trigger — manually trigger reminders (UI button)
router.post('/trigger', protect, authorize('ADMIN', 'ACCOUNTANT', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const result = await triggerRemindersForSchool(req.user.schoolId);
  res.json(result);
}));

// GET /reminders/log — history of reminders sent
router.get('/log', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('fee_reminders')
    .select(`
      id, type, channel, phone, status, sent_at,
      students (name, class_name, section)
    `)
    .eq('students.school_id', req.user.schoolId)
    .order('sent_at', { ascending: false })
    .limit(100);

  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
}));

export default router;
