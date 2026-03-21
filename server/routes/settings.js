import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/settings/school — Get school profile
router.get('/school', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('schools')
    .select('*')
    .eq('id', req.user.schoolId)
    .single();

  if (error) throw error;
  res.json(data);
}));

// PUT /api/settings/school — Update school profile
router.put('/school', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { name, address, phone, affiliationNo, logoUrl } = req.body;

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  if (phone !== undefined) updates.phone = phone;
  if (affiliationNo !== undefined) updates.affiliation_no = affiliationNo;
  if (logoUrl !== undefined) updates.logo_url = logoUrl;

  const { data, error } = await supabase
    .from('schools')
    .update(updates)
    .eq('id', req.user.schoolId)
    .select()
    .single();

  if (error) throw error;
  res.json(data);
}));

// GET /api/settings/sessions — List academic sessions
router.get('/sessions', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('academic_sessions')
    .select('*')
    .eq('school_id', req.user.schoolId)
    .order('start_date', { ascending: false });

  if (error) throw error;
  res.json(data || []);
}));

// POST /api/settings/sessions — Create academic session
router.post('/sessions', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { name, startDate, endDate, isActive } = req.body;

  // If new session is active, deactivate all others
  if (isActive) {
    await supabase
      .from('academic_sessions')
      .update({ is_active: false })
      .eq('school_id', req.user.schoolId);
  }

  const { data, error } = await supabase
    .from('academic_sessions')
    .insert([{
      name,
      start_date: startDate,
      end_date: endDate,
      is_active: isActive || false,
      school_id: req.user.schoolId,
    }])
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(data);
}));

export default router;
