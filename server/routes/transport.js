import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/transport/vehicles
router.get('/vehicles', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('vehicles')
    .select('*')
    .eq('school_id', req.user.schoolId);
  if (error) throw error;
  res.json(data);
}));

export default router;
