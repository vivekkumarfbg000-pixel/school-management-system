import express from 'express';
const router = express.Router();
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';
import asyncHandler from '../utils/asyncHandler.js';

router.get('/', protect, asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.length < 2) return res.json({ students: [], staff: [], books: [] });

  const query = q.toLowerCase();

  // Parallel search across tables
  const [students, staff, books] = await Promise.all([
    supabase
      .from('students')
      .select('id, name, admission_no, class_name, section')
      .eq('school_id', req.user.schoolId)
      .ilike('name', `%${query}%`)
      .limit(5),
    supabase
      .from('staff')
      .select('id, name, designation, staff_id')
      .eq('school_id', req.user.schoolId)
      .ilike('name', `%${query}%`)
      .limit(5),
    supabase
      .from('books')
      .select('id, title, author, accession_no')
      .eq('school_id', req.user.schoolId)
      .ilike('title', `%${query}%`)
      .limit(5)
  ]);

  res.json({
    students: students.data || [],
    staff: staff.data || [],
    books: books.data || []
  });
}));

export default router;
