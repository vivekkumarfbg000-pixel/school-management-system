import express from 'express';
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// GET /expenses — list with filters
router.get('/', protect, asyncHandler(async (req, res) => {
  const { month, category } = req.query;
  let query = supabase
    .from('expenses')
    .select('*')
    .eq('school_id', req.user.schoolId)
    .order('date', { ascending: false });

  if (month) {
    const [year, mon] = month.split('-');
    const start = `${year}-${mon}-01`;
    const end = `${year}-${mon}-${new Date(year, mon, 0).getDate()}`;
    query = query.gte('date', start).lte('date', end);
  }
  if (category) query = query.eq('category', category);

  const { data, error } = await query;
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
}));

// GET /expenses/pnl — monthly P&L summary (revenue vs expenses)
router.get('/pnl', protect, asyncHandler(async (req, res) => {
  const schoolId = req.user.schoolId;
  const { month } = req.query;
  const targetMonth = month || new Date().toISOString().substring(0, 7);
  const [year, mon] = targetMonth.split('-');
  const start = `${year}-${mon}-01`;
  const end = `${year}-${mon}-${new Date(parseInt(year), parseInt(mon), 0).getDate()}`;

  // Revenue: fees collected this month
  const { data: feeData } = await supabase
    .from('fees')
    .select('paid_amount, students!inner(school_id)')
    .eq('students.school_id', schoolId)
    .eq('status', 'Paid')
    .gte('paid_date', start)
    .lte('paid_date', end);
  const totalRevenue = feeData?.reduce((acc, f) => acc + (f.paid_amount || 0), 0) || 0;

  // Expenses this month
  const { data: expData } = await supabase
    .from('expenses')
    .select('amount, category')
    .eq('school_id', schoolId)
    .gte('date', start)
    .lte('date', end);
  const totalExpenses = expData?.reduce((acc, e) => acc + e.amount, 0) || 0;

  // Category breakdown
  const categoryBreakdown = {};
  expData?.forEach(e => {
    categoryBreakdown[e.category] = (categoryBreakdown[e.category] || 0) + e.amount;
  });

  // Last 6 months P&L for chart
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(parseInt(year), parseInt(mon) - 1 - i, 1);
    const mStart = d.toISOString().split('T')[0];
    const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });

    const { data: mFees } = await supabase
      .from('fees').select('paid_amount, students!inner(school_id)')
      .eq('students.school_id', schoolId).eq('status', 'Paid')
      .gte('paid_date', mStart).lte('paid_date', mEnd);
    const { data: mExp } = await supabase
      .from('expenses').select('amount').eq('school_id', schoolId)
      .gte('date', mStart).lte('date', mEnd);

    monthlyData.push({
      month: label,
      revenue: mFees?.reduce((a, f) => a + (f.paid_amount || 0), 0) || 0,
      expenses: mExp?.reduce((a, e) => a + e.amount, 0) || 0,
    });
  }

  res.json({
    month: targetMonth,
    totalRevenue,
    totalExpenses,
    netProfit: totalRevenue - totalExpenses,
    profitMargin: totalRevenue > 0 ? Math.round(((totalRevenue - totalExpenses) / totalRevenue) * 100) : 0,
    categoryBreakdown,
    monthlyChart: monthlyData,
  });
}));

// POST /expenses — add expense
router.post('/', protect, authorize('ADMIN', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const { category, description, amount, date, paidTo, paymentMode, receiptUrl } = req.body;
  if (!category || !description || !amount) {
    return res.status(400).json({ message: 'Category, description and amount are required' });
  }

  const { data, error } = await supabase
    .from('expenses')
    .insert({
      category,
      description,
      amount: parseFloat(amount),
      date: date || new Date().toISOString().split('T')[0],
      paid_to: paidTo,
      payment_mode: paymentMode || 'Cash',
      receipt_url: receiptUrl,
      school_id: req.user.schoolId,
      created_by: req.user.id,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
}));

// PUT /expenses/:id
router.put('/:id', protect, authorize('ADMIN', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const { category, description, amount, date, paidTo, paymentMode } = req.body;
  const { data, error } = await supabase
    .from('expenses')
    .update({ category, description, amount: parseFloat(amount), date, paid_to: paidTo, payment_mode: paymentMode })
    .eq('id', req.params.id).eq('school_id', req.user.schoolId)
    .select().single();
  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
}));

// DELETE /expenses/:id
router.delete('/:id', protect, authorize('ADMIN', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('expenses').delete()
    .eq('id', req.params.id).eq('school_id', req.user.schoolId);
  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Expense deleted' });
}));

export default router;
