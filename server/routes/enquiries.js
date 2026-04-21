import express from 'express';
import supabase from '../utils/supabaseClient.js';
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

const router = express.Router();

// GET /enquiries — list all enquiries with pipeline counts
router.get('/', protect, asyncHandler(async (req, res) => {
  const { status, source } = req.query;
  let query = supabase
    .from('enquiries')
    .select('*')
    .eq('school_id', req.user.schoolId)
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
  if (source) query = query.eq('source', source);

  const { data, error } = await query;
  if (error) return res.status(500).json({ message: error.message });
  res.json(data || []);
}));

// GET /enquiries/pipeline — counts per stage for Kanban view
router.get('/pipeline', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('enquiries')
    .select('status, source')
    .eq('school_id', req.user.schoolId);

  if (error) return res.status(500).json({ message: error.message });

  const stages = ['New', 'Contacted', 'Test Scheduled', 'Admitted', 'Lost'];
  const pipeline = stages.map(stage => ({
    stage,
    count: data?.filter(e => e.status === stage).length || 0,
  }));

  const sourceStats = {};
  data?.forEach(e => {
    sourceStats[e.source] = (sourceStats[e.source] || 0) + 1;
  });

  const conversionRate = data?.length > 0
    ? Math.round((data.filter(e => e.status === 'Admitted').length / data.length) * 100)
    : 0;

  res.json({ pipeline, sourceStats, total: data?.length || 0, conversionRate });
}));

// POST /enquiries — create new enquiry
router.post('/', protect, asyncHandler(async (req, res) => {
  const { studentName, parentName, phone, email, classApplied, source, notes, followUpDate } = req.body;

  if (!studentName || !parentName || !phone || !classApplied) {
    return res.status(400).json({ message: 'Student name, parent name, phone, and class are required' });
  }

  const { data, error } = await supabase
    .from('enquiries')
    .insert({
      student_name: studentName,
      parent_name: parentName,
      phone,
      email,
      class_applied: classApplied,
      source: source || 'walk-in',
      notes,
      follow_up_date: followUpDate || null,
      school_id: req.user.schoolId,
    })
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.status(201).json(data);
}));

// PUT /enquiries/:id — update status, add notes, set follow-up
router.put('/:id', protect, asyncHandler(async (req, res) => {
  const { status, notes, followUpDate, lostReason, assignedTo } = req.body;

  const { data, error } = await supabase
    .from('enquiries')
    .update({
      ...(status && { status }),
      ...(notes !== undefined && { notes }),
      ...(followUpDate !== undefined && { follow_up_date: followUpDate }),
      ...(lostReason && { lost_reason: lostReason }),
      ...(assignedTo && { assigned_to: assignedTo }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.params.id)
    .eq('school_id', req.user.schoolId)
    .select()
    .single();

  if (error) return res.status(500).json({ message: error.message });
  res.json(data);
}));

// DELETE /enquiries/:id
router.delete('/:id', protect, authorize('ADMIN', 'PRINCIPAL'), asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('enquiries')
    .delete()
    .eq('id', req.params.id)
    .eq('school_id', req.user.schoolId);

  if (error) return res.status(500).json({ message: error.message });
  res.json({ message: 'Enquiry deleted' });
}));

export default router;
