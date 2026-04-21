import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/payroll/slips — List all salary slips
router.get('/slips', protect, authorize('ADMIN', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('salary_slips')
    .select('*, staff(name, designation, staff_id)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  res.json(data || []);
}));

// POST /api/payroll/generate — Generate salary slip for a staff member
router.post('/generate', protect, authorize('ADMIN', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const { staffId, month } = req.body;

  if (!staffId || !month) {
    return res.status(400).json({ message: 'staffId and month are required' });
  }

  // Fetch staff details
  const { data: staff, error: sErr } = await supabase
    .from('staff')
    .select('*')
    .eq('id', staffId)
    .single();

  if (sErr || !staff) return res.status(404).json({ message: 'Staff not found' });

  // Check for duplicate
  const { data: existing } = await supabase
    .from('salary_slips')
    .select('id')
    .eq('staff_id', staffId)
    .eq('month', month)
    .limit(1);

  if (existing && existing.length > 0) {
    return res.status(409).json({ message: `Salary slip for ${month} already exists for this staff member` });
  }

  // Count absent days for the month
  let startOfMonth, endOfMonth;
  if (month.includes('-')) {
    // Format "YYYY-MM"
    const [year, mon] = month.split('-');
    startOfMonth = `${year}-${mon}-01`;
    endOfMonth = new Date(parseInt(year), parseInt(mon), 0).toISOString().split('T')[0];
  } else {
    // Format "Month YYYY" e.g. "March 2026"
    const dateObj = new Date(month + " 1");
    startOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth(), 1).toISOString().split('T')[0];
    endOfMonth = new Date(dateObj.getFullYear(), dateObj.getMonth() + 1, 0).toISOString().split('T')[0];
  }

  // Try to get absent days from staff attendance for this month
  let absentDays = 0;
  try {
    const { data: absences } = await supabase
      .from('staff_attendance')
      .select('id')
      .eq('staff_id', staffId)
      .eq('status', 'Absent')
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);
    absentDays = absences ? absences.length : 0;
  } catch (e) {
    // If table doesn't exist or error, default to 0
    absentDays = 0;
  }

  // Calculate salary
  const basicSalary = staff.basic_salary || 0;
  const da = staff.da || 0;
  const hra = staff.hra || 0;
  const allowances = staff.allowances || 0;
  const grossSalary = basicSalary + da + hra + allowances;

  const pfDeduction = staff.pf_deduction || staff.pfDeduction || 0;
  const tdsDeduction = staff.tds_deduction || staff.tdsDeduction || 0;
  
  // Per day salary = gross / 30 (standard)
  const perDaySalary = grossSalary / 30;
  const absentDeduction = Math.round(perDaySalary * absentDays);
  
  const totalDeductions = pfDeduction + tdsDeduction + absentDeduction;
  const netSalary = grossSalary - totalDeductions;

  const { data: slip, error: insertErr } = await supabase
    .from('salary_slips')
    .insert([{
      month,
      gross_salary: grossSalary,
      total_deductions: totalDeductions,
      net_salary: netSalary,
      absent_days: absentDays,
      absent_deduction: absentDeduction,
      status: 'Generated',
      staff_id: staffId,
    }])
    .select('*, staff(name, designation, staff_id)')
    .single();

  if (insertErr) throw insertErr;
  res.status(201).json(slip);
}));

// PUT /api/payroll/slips/:id/pay — Mark slip as paid
router.put('/slips/:id/pay', protect, authorize('ADMIN', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('salary_slips')
    .update({ status: 'Paid', paid_date: new Date().toISOString() })
    .eq('id', req.params.id)
    .select()
    .single();

  if (error) throw error;
  res.json(data);
}));

// ── LEAVE MANAGEMENT ──

// GET /api/payroll/leaves — List all leave requests
router.get('/leaves', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('leaves')
    .select('*, staff(name, designation, staff_id)')
    .order('from_date', { ascending: false });
  if (error) throw error;
  res.json(data || []);
}));

// POST /api/payroll/leaves/apply — Apply for leave
router.post('/leaves/apply', protect, asyncHandler(async (req, res) => {
  const { staffId, type, fromDate, toDate, days, reason } = req.body;

  if (!staffId || !type || !fromDate || !toDate || !days) {
    return res.status(400).json({ message: 'staffId, type, fromDate, toDate, and days are required' });
  }

  const { data, error } = await supabase
    .from('leaves')
    .insert([{
      type,
      from_date: fromDate,
      to_date: toDate,
      days: parseInt(days),
      reason: reason || '',
      status: 'Pending',
      staff_id: staffId
    }])
    .select('*, staff(name, designation)')
    .single();

  if (error) throw error;
  res.status(201).json(data);
}));

// PUT /api/payroll/leaves/:id — Approve or reject leave
router.put('/leaves/:id', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { status } = req.body; // "Approved" or "Rejected"

  if (!['Approved', 'Rejected'].includes(status)) {
    return res.status(400).json({ message: 'Status must be Approved or Rejected' });
  }

  const { data, error } = await supabase
    .from('leaves')
    .update({ status })
    .eq('id', req.params.id)
    .select('*, staff(name, designation)')
    .single();

  if (error) throw error;
  res.json(data);
}));

// ── STAFF ATTENDANCE ──

// GET /api/payroll/staff-attendance?month=2026-03
router.get('/staff-attendance', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { month } = req.query;

  let query = supabase
    .from('staff_attendance')
    .select('*, staff(name, designation, staff_id)')
    .order('date', { ascending: false });

  if (month) {
    const startDate = `${month}-01`;
    const year = parseInt(month.split('-')[0]);
    const mon = parseInt(month.split('-')[1]);
    const endDate = `${month}-${new Date(year, mon, 0).getDate()}`;
    query = query.gte('date', startDate).lte('date', endDate);
  }

  const { data, error } = await query;
  if (error) throw error;
  res.json(data || []);
}));

export default router;
