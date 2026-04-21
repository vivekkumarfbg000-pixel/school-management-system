import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/staff
router.get('/', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('staff')
    .select('*')
    .eq('school_id', req.user.schoolId)
    .order('name');
  if (error) throw error;
  res.json(data);
}));

// POST /api/staff
router.post('/', protect, authorize('ADMIN'), asyncHandler(async (req, res) => {
  const { 
    staffId, name, designation, type, qualification, phone, 
    basicSalary, subjects, joiningDate 
  } = req.body;

  const { data, error } = await supabase
    .from('staff')
    .insert([{
      staff_id: staffId,
      name,
      designation,
      type,
      qualification,
      phone,
      basic_salary: parseFloat(basicSalary),
      subjects,
      joining_date: joiningDate,
      school_id: req.user.schoolId
    }])
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(data);
}));

// DELETE /api/staff/:id
router.delete('/:id', protect, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('staff')
    .update({ status: 'Inactive' })
    .eq('id', req.params.id);
  if (error) throw error;
  res.json({ message: 'Staff record updated to inactive' });
}));

// PUT /api/staff/:id
router.put('/:id', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const updates = req.body;
  const { data, error } = await supabase
    .from('staff')
    .update(updates)
    .eq('id', req.params.id)
    .eq('school_id', req.user.schoolId)
    .select()
    .single();

  if (error) throw error;
  res.json(data);
}));

export default router;
