import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { generateFeeReceiptPDF, generateSalarySlipPDF } from '../utils/pdfGenerator.js';
import { generateStudentListExcel, generateAttendanceExcel, generateFeeReportExcel } from '../utils/excelGenerator.js';
import { generateStudentIdCard, generateTransferCertificate } from '../utils/docGenerator.js';

// GET /api/export/fee-receipt/:feeId — Download fee receipt PDF
router.get('/fee-receipt/:feeId', protect, asyncHandler(async (req, res) => {
  const { data: fee, error } = await supabase
    .from('fees')
    .select('*, students(name, admission_no, class_name, section)')
    .eq('id', req.params.feeId)
    .single();

  if (error || !fee) return res.status(404).json({ message: 'Fee record not found' });

  // Get school name
  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .eq('id', req.user.schoolId)
    .single();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=receipt-${fee.receipt_no || fee.id}.pdf`);

  generateFeeReceiptPDF(res, {
    schoolName: school?.name,
    studentName: fee.students?.name,
    admissionNo: fee.students?.admission_no,
    className: fee.students?.class_name,
    section: fee.students?.section,
    feeType: fee.fee_type,
    amount: fee.amount + fee.late_fee,
    paidAmount: fee.paid_amount,
    receiptNo: fee.receipt_no,
    paidDate: fee.paid_date,
  });
}));

// GET /api/export/salary-slip/:slipId — Download salary slip PDF
router.get('/salary-slip/:slipId', protect, authorize('ADMIN', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const { data: slip, error } = await supabase
    .from('salary_slips')
    .select('*, staff(name, staff_id, designation, basic_salary, da, hra, allowances, pf_deduction, tds_deduction)')
    .eq('id', req.params.slipId)
    .single();

  if (error || !slip) return res.status(404).json({ message: 'Salary slip not found' });

  const { data: school } = await supabase
    .from('schools')
    .select('name')
    .eq('id', req.user.schoolId)
    .single();

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename=salary-${slip.month}-${slip.staff?.staff_id || slip.id}.pdf`);

  generateSalarySlipPDF(res, {
    schoolName: school?.name,
    staffName: slip.staff?.name,
    staffId: slip.staff?.staff_id,
    designation: slip.staff?.designation,
    month: slip.month,
    basicSalary: slip.staff?.basic_salary,
    da: slip.staff?.da,
    hra: slip.staff?.hra,
    allowances: slip.staff?.allowances,
    pfDeduction: slip.staff?.pf_deduction,
    tdsDeduction: slip.staff?.tds_deduction,
    absentDays: slip.absent_days,
    absentDeduction: slip.absent_deduction,
    grossSalary: slip.gross_salary,
    totalDeductions: slip.total_deductions,
    netSalary: slip.net_salary,
    status: slip.status,
  });
}));

// GET /api/export/students — Student list Excel
router.get('/students', protect, asyncHandler(async (req, res) => {
  const { data: students, error } = await supabase
    .from('students')
    .select('*')
    .eq('school_id', req.user.schoolId)
    .order('class_name')
    .order('name');

  if (error) throw error;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
  await generateStudentListExcel(res, students || []);
}));

// GET /api/export/attendance?className=10&section=A&month=2026-03
router.get('/attendance', protect, asyncHandler(async (req, res) => {
  const { className, section, month } = req.query;
  if (!className || !section || !month) {
    return res.status(400).json({ message: 'className, section, and month are required' });
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

  // Get all attendance for month range
  const startDate = `${month}-01`;
  const year = parseInt(month.split('-')[0]);
  const mon = parseInt(month.split('-')[1]);
  const endDate = `${month}-${new Date(year, mon, 0).getDate()}`;

  const { data: records, error: aErr } = await supabase
    .from('attendance')
    .select('student_id, date, status')
    .in('student_id', (students || []).map(s => s.id))
    .gte('date', startDate)
    .lte('date', endDate);

  if (aErr) throw aErr;

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=attendance-${className}-${section}-${month}.xlsx`);
  await generateAttendanceExcel(res, { month, className, section, students: students || [], records: records || [] });
}));

// GET /api/export/fee-report?type=daily|monthly
router.get('/fee-report', protect, authorize('ADMIN', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const reportType = req.query.type || 'daily';
  const today = new Date().toISOString().split('T')[0];

  let query = supabase
    .from('fees')
    .select('*, students(name, class_name, section)')
    .order('paid_date', { ascending: false });

  if (reportType === 'daily') {
    query = query.eq('paid_date', today);
  } else if (reportType === 'monthly') {
    const monthStart = today.substring(0, 7) + '-01';
    query = query.gte('paid_date', monthStart).lte('paid_date', today);
  }

  const { data: fees, error } = await query;
  if (error) throw error;

  // Flatten for Excel
  const flatFees = (fees || []).map(f => ({
    ...f,
    student_name: f.students?.name,
    class_name: f.students?.class_name,
  }));

  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename=fee-report-${reportType}-${today}.xlsx`);
  await generateFeeReportExcel(res, { fees: flatFees, reportType, date: today });
}));

// GET /api/export/id-card/:id
router.get('/id-card/:id', protect, asyncHandler(async (req, res) => {
  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !student) return res.status(404).json({ message: 'Student not found' });
  await generateStudentIdCard(student, res);
}));

// GET /api/export/tc/:id
router.get('/tc/:id', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { data: student, error } = await supabase
    .from('students')
    .select('*')
    .eq('id', req.params.id)
    .single();

  if (error || !student) return res.status(404).json({ message: 'Student not found' });
  
  await supabase.from('students').update({ status: 'TC Issued' }).eq('id', req.params.id);
  await generateTransferCertificate(student, res);
}));

export default router;
