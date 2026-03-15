import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/payroll/slips
router.get('/slips', protect, authorize('ADMIN', 'ACCOUNTANT'), asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('salary_slips')
    .select('*, staff(name, designation)')
    .order('month', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

export default router;
