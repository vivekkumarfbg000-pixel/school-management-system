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

// POST /api/library/add
router.post('/add', protect, asyncHandler(async (req, res) => {
  const { accession_no, title, author, category, quantity, shelf_location } = req.body;
  
  const { data, error } = await supabase
    .from('books')
    .insert([{
      accession_no,
      title,
      author,
      category,
      quantity: parseInt(quantity),
      available: parseInt(quantity),
      shelf_location,
      school_id: req.user.schoolId
    }])
    .select()
    .single();

  if (error) throw error;
  res.status(201).json(data);
}));

// POST /api/library/issue
router.post('/issue', protect, asyncHandler(async (req, res) => {
  const { bookId, studentId, dueDate } = req.body;

  // 1. Check if book is available
  const { data: book, error: bErr } = await supabase
    .from('books')
    .select('available')
    .eq('id', bookId)
    .single();
  
  if (bErr || !book) return res.status(404).json({ message: 'Book not found' });
  if (book.available <= 0) return res.status(400).json({ message: 'Book is currently unavailable' });

  // 2. Create Issue Record
  const { data: issue, error: iErr } = await supabase
    .from('book_issues')
    .insert([{
      book_id: bookId,
      student_id: studentId,
      due_date: dueDate,
      status: 'Issued'
    }])
    .select()
    .single();

  if (iErr) throw iErr;

  // 3. Update Book Availability
  await supabase
    .from('books')
    .update({ available: book.available - 1 })
    .eq('id', bookId);

  res.status(201).json(issue);
}));

// POST /api/library/return
router.post('/return', protect, asyncHandler(async (req, res) => {
  const { issueId } = req.body;

  // 1. Get Issue Record
  const { data: issue, error: iErr } = await supabase
    .from('book_issues')
    .select('*, books(available, id)')
    .eq('id', issueId)
    .single();
  
  if (iErr || !issue) return res.status(404).json({ message: 'Issue record not found' });
  if (issue.status === 'Returned') return res.status(400).json({ message: 'Book already returned' });

  // 2. Update Issue Record
  const { data: updated, error: uErr } = await supabase
    .from('book_issues')
    .update({
      return_date: new Date().toISOString(),
      status: 'Returned'
    })
    .eq('id', issueId)
    .select()
    .single();

  if (uErr) throw uErr;

  // 3. Update Book Availability
  await supabase
    .from('books')
    .update({ available: issue.books.available + 1 })
    .eq('id', issue.books.id);

  res.json({ message: 'Book returned successfully', updated });
}));

// GET /api/library/issues
router.get('/issues', protect, asyncHandler(async (req, res) => {
  const { data, error } = await supabase
    .from('book_issues')
    .select('*, books(title, accession_no), students(name, class_name, section)')
    .order('issue_date', { ascending: false });
  
  if (error) throw error;
  res.json(data);
}));

export default router;
