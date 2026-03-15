import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/library/books
router.get('/books', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('books')
    .select('*')
    .eq('school_id', req.user.schoolId)
    .order('title');
  if (error) throw error;
  res.json(data);
}));

export default router;
