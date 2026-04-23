import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect, requireClassOwnership } from '../middleware/auth.js';
import { sendSMS } from '../utils/smsProvider.js';
import { sendWhatsAppMessage } from '../utils/whatsappProvider.js';
import asyncHandler from '../utils/asyncHandler.js';

// GET /api/attendance?className=10&section=A&date=2026-03-14
router.get('/', protect, requireClassOwnership(), asyncHandler(async (req, res) => {
  const { className, section, date } = req.query;
  if (!className || !section || !date) {
    return res.status(400).json({ message: 'class, section, and date are required' });
  }

  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('id, name, admission_no')
    .eq('school_id', req.user.schoolId)
    .eq('class_name', className)
    .eq('section', section)
    .eq('status', 'Active')
    .order('name');
  if (sErr) throw sErr;

  if (!students || students.length === 0) return res.json([]);

  const { data: records, error: aErr } = await supabase
    .from('attendance')
    .select('student_id, status')
    .in('student_id', students.map(s => s.id))
    .eq('date', date);
  if (aErr) throw aErr;

  const attMap = {};
  (records || []).forEach(r => { attMap[r.student_id] = r.status; });

  const result = students.map(s => ({ ...s, status: attMap[s.id] || null }));
  res.json(result);
}));

// POST /api/attendance/batch
router.post('/batch', protect, requireClassOwnership(), asyncHandler(async (req, res) => {
  const { records, date } = req.body;
  if (!records || !Array.isArray(records) || !date) {
    return res.status(400).json({ message: 'Invalid payload' });
  }

  const attendanceData = records.map(r => ({
    student_id: r.studentId,
    date,
    status: r.status,
    marked_by: req.user.id
  }));

  const { error: upsertError } = await supabase
    .from('attendance')
    .upsert(attendanceData, { onConflict: 'student_id,date' });
  if (upsertError) throw upsertError;

  // Trigger WhatsApp + SMS for Absent Students
  const absentIds = records.filter(r => r.status && r.status.toUpperCase() === 'ABSENT').map(r => r.studentId);
  
  if (absentIds.length > 0) {
    // Fetch phone numbers for absent students and school details
    const { data: studentsWithPhones, error: pErr } = await supabase
      .from('students')
      .select('name, phone, school_id')
      .in('id', absentIds);
    
    if (!pErr && studentsWithPhones) {
      for (const student of studentsWithPhones) {
        if (student.phone) {
          const msg = `⚠️ *Attendance Alert*\nDear Parent, your child ${student.name} was marked ABSENT today. If you are unaware, please contact the school office.`;
          
          // Send WhatsApp (Primary)
          try {
             await sendWhatsAppMessage(student.phone, msg);
          } catch (waErr) {
             console.error("[Attendance] Failed to send WhatsApp alert:", waErr);
          }

          // Fallback to SMS
          try {
             await sendSMS(student.phone, msg);
          } catch (smsErr) {
             // Ignore
          }
        }
      }
    }
  }

  res.json({ message: 'Attendance processed successfully' });
}));

// GET /api/attendance/summary?className=10&section=A&month=2026-03
router.get('/summary', protect, asyncHandler(async (req, res) => {
  const { className, section, month } = req.query;
  if (!className || !section || !month) {
    return res.status(400).json({ message: 'className, section, and month are required' });
  }

  const { data: students, error: sErr } = await supabase
    .from('students')
    .select('id, name, admission_no')
    .eq('school_id', req.user.schoolId)
    .eq('class_name', className)
    .eq('section', section)
    .eq('status', 'Active')
    .order('name');

  if (sErr) throw sErr;
  if (!students || students.length === 0) return res.json({ students: [], totals: {} });

  const startDate = `${month}-01`;
  const year = parseInt(month.split('-')[0]);
  const mon = parseInt(month.split('-')[1]);
  const endDate = `${month}-${new Date(year, mon, 0).getDate()}`;

  const { data: records, error: aErr } = await supabase
    .from('attendance')
    .select('student_id, status')
    .in('student_id', students.map(s => s.id))
    .gte('date', startDate)
    .lte('date', endDate);

  if (aErr) throw aErr;

  const summaryMap = {};
  students.forEach(s => {
    summaryMap[s.id] = { present: 0, absent: 0, late: 0, total: 0 };
  });

  (records || []).forEach(r => {
    if (summaryMap[r.student_id]) {
      summaryMap[r.student_id].total++;
      if (r.status === 'Present') summaryMap[r.student_id].present++;
      else if (r.status === 'Absent') summaryMap[r.student_id].absent++;
      else if (r.status === 'Late') summaryMap[r.student_id].late++;
    }
  });

  const result = students.map(s => ({
    ...s,
    ...summaryMap[s.id],
    percentage: summaryMap[s.id].total > 0
      ? Math.round((summaryMap[s.id].present + summaryMap[s.id].late) / summaryMap[s.id].total * 100)
      : 0
  }));

  const totalPresent = result.reduce((a, s) => a + s.present, 0);
  const totalAbsent = result.reduce((a, s) => a + s.absent, 0);
  const totalLate = result.reduce((a, s) => a + s.late, 0);
  const totalRecords = result.reduce((a, s) => a + s.total, 0);

  res.json({
    students: result,
    totals: {
      present: totalPresent,
      absent: totalAbsent,
      late: totalLate,
      total: totalRecords,
      percentage: totalRecords > 0 ? Math.round((totalPresent + totalLate) / totalRecords * 100) : 0
    }
  });
}));

export default router;
