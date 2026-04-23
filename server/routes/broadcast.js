import express from 'express';
const router = express.Router();
import { protect, authorize } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';
import { broadcastToParents } from '../utils/whatsappProvider.js';
import supabase from '../utils/supabaseClient.js';

/**
 * @route   POST /api/broadcast/emergency
 * @desc    Critical school-wide emergency broadcast
 * @access  Private (Principal only)
 */
router.post('/emergency', protect, authorize('PRINCIPAL'), asyncHandler(async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ message: 'Emergency message content required' });

  // 1. Log the emergency trigger in an audit log (Optional but good)
  console.log(`🚨 [EMERGENCY] Triggered by ${req.user.name} for school ${req.user.schoolId}`);

  // 2. Broadcast to all parents
  const parentResults = await broadcastToParents(req.user.schoolId, null, `🚨 *EMERGENCY ALERT*\n\n${message}`);

  // 3. Broadcast to all staff
  const { data: staff, error: staffError } = await supabase
    .from('staff')
    .select('phone')
    .eq('school_id', req.user.schoolId)
    .not('phone', 'is', null);

  let staffCount = 0;
  if (staff && staff.length > 0) {
    const { sendWhatsAppMessage } = await import('../utils/whatsappProvider.js');
    const staffPhones = [...new Set(staff.map(s => s.phone))];
    const staffResults = await Promise.allSettled(
      staffPhones.map(phone => sendWhatsAppMessage(phone, `🚨 *STAFF EMERGENCY ALERT*\n\n${message}`))
    );
    staffCount = staffResults.filter(r => r.status === 'fulfilled' && r.value?.success).length;
  }

  res.json({
    success: true,
    message: `Emergency alert sent to ${parentResults.count} parents and ${staffCount} staff members.`,
    stats: { parents: parentResults.count, staff: staffCount }
  });
}));

export default router;
