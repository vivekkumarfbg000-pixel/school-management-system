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

// GET /api/settings/fee-structures
router.get('/fee-structures', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('fee_structures')
    .select('*')
    .eq('school_id', req.user.schoolId)
    .order('class_name');
  if (error) throw error;
  res.json(data || []);
}));

// POST /api/settings/fee-structures
router.post('/fee-structures', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { class_name, fee_type, amount, cycle } = req.body;
  const { data, error } = await supabase
    .from('fee_structures')
    .insert([{ class_name, fee_type, amount: parseFloat(amount), cycle, school_id: req.user.schoolId }])
    .select()
    .single();
  if (error) throw error;
  res.status(201).json(data);
}));

// PUT /api/settings/fee-structures/:id
router.put('/fee-structures/:id', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const updates = req.body;
  const { data, error } = await supabase
    .from('fee_structures')
    .update(updates)
    .eq('id', req.params.id)
    .eq('school_id', req.user.schoolId)
    .select()
    .single();
  if (error) throw error;
  res.json(data);
}));

// DELETE /api/settings/fee-structures/:id
router.delete('/fee-structures/:id', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('fee_structures')
    .delete()
    .eq('id', req.params.id)
    .eq('school_id', req.user.schoolId);
  if (error) throw error;
  res.json({ message: 'Fee structure deleted successfully' });
}));

export default router;
