import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

router.get('/', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .eq('school_id', req.user.schoolId)
    .order('check_in', { ascending: false });
  if (error) throw error;
  res.json(data);
}));

router.post('/', protect, asyncHandler(async (req, res) => {
  const visitor = { ...req.body, school_id: req.user.schoolId };
  const { data, error } = await supabase.from('visitors').insert([visitor]).select().single();
  if (error) throw error;
  res.status(201).json(data);
}));

router.put('/:id', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('visitors')
    .update(req.body)
    .eq('id', req.params.id)
    .eq('school_id', req.user.schoolId)
    .select().single();
  if (error) throw error;
  res.json(data);
}));

export default router;
