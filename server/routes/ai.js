import express from 'express';
import { processAICommand, generateInsights } from '../utils/aiService.js';
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

/**
 * Helper to fetch school stats for AI context
 */
async function getSchoolContext(schoolId) {
  const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
  const { count: staffCount } = await supabase.from('staff').select('*', { count: 'exact', head: true }).eq('school_id', schoolId);
  
  const today = new Date().toISOString().split('T')[0];
  const { data: attendance } = await supabase.from('attendance').select('status').eq('date', today);
  const presentCount = attendance?.filter(a => a.status === 'PRESENT').length || 0;
  
  const { data: fees } = await supabase.from('fees').select('amount').eq('status', 'Paid');
  const totalRevenue = fees?.reduce((sum, f) => sum + (f.amount || 0), 0) || 0;

  return {
    totalStudents: studentCount || 0,
    totalStaff: staffCount || 0,
    studentsPresentToday: presentCount,
    totalRevenue: totalRevenue
  };
}

router.post('/command', protect, asyncHandler(async (req, res) => {
  const { transcript } = req.body;
  if (!transcript) {
    return res.status(400).json({ message: 'Transcript is required' });
  }

  const contextData = await getSchoolContext(req.user.schoolId);
  const command = await processAICommand(transcript, contextData);
  res.json(command);
}));

router.get('/insights', protect, asyncHandler(async (req, res) => {
  const contextData = await getSchoolContext(req.user.schoolId);
  const insights = await generateInsights(contextData);
  res.json(insights);
}));

export default router;
