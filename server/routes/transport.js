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
    .eq('school_id', req.user.schoolId)
    .order('vehicle_no');
  if (error) throw error;

  // Enhance with current occupancy counts
  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('id, transport_vehicle_id')
    .eq('school_id', req.user.schoolId)
    .not('transport_vehicle_id', 'is', null);
  
  const occupancyMap = {};
  (students || []).forEach(s => {
    occupancyMap[s.transport_vehicle_id] = (occupancyMap[s.transport_vehicle_id] || 0) + 1;
  });

  const result = data.map(v => ({
    ...v,
    occupancy: occupancyMap[v.id] || 0,
    status: (occupancyMap[v.id] || 0) >= v.capacity ? 'Full' : 'Active'
  }));

  res.json(result);
}));

// POST /api/transport/add
router.post('/add', protect, asyncHandler(async (req, res) => {
  const { vehicle_no, type, capacity, driver_name, driver_phone, route_name, stops } = req.body;
  
  const { data, error } = await supabase
    .from('vehicles')
    .insert([{
      vehicle_no,
      type,
      capacity: parseInt(capacity),
      driver_name,
      driver_phone,
      route_name,
      stops: Array.isArray(stops) ? stops : JSON.parse(stops),
      school_id: req.user.schoolId
    }])
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(data);
}));

// POST /api/transport/assign
router.post('/assign', protect, asyncHandler(async (req, res) => {
  const { studentId, vehicleId } = req.body;

  const { error } = await supabase
    .from('students')
    .update({ transport_vehicle_id: vehicleId })
    .eq('id', studentId);

  if (error) throw error;
  res.json({ message: 'Student assigned to vehicle successfully' });
}));

// PUT /api/transport/vehicles/:id
router.put('/vehicles/:id', protect, asyncHandler(async (req, res) => {
  const updates = req.body;
  const { data, error } = await supabase
    .from('vehicles')
    .update(updates)
    .eq('id', req.params.id)
    .eq('school_id', req.user.schoolId)
    .select()
    .single();

  if (error) throw error;
  res.json(data);
}));

// DELETE /api/transport/vehicles/:id
router.delete('/vehicles/:id', protect, asyncHandler(async (req, res) => {
  const { error } = await supabase
    .from('vehicles')
    .delete()
    .eq('id', req.params.id)
    .eq('school_id', req.user.schoolId);

  if (error) throw error;
  res.json({ message: 'Vehicle deleted successfully' });
}));

export default router;
