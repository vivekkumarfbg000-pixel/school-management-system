import express from 'express';
const router = express.Router();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import rateLimit from 'express-rate-limit';
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('FATAL ERROR: JWT_SECRET is not defined in production environment.');
  process.exit(1);
}
const SAFE_SECRET = JWT_SECRET || 'development_fallback_secret';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 20, 
  message: { message: 'Too many authentication attempts from this IP, please try again after 15 minutes' }
});

// ── Input Validation Schemas ──
const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const signupSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  schoolName: z.string().min(2, 'School name must be at least 2 characters').max(200),
  phone: z.string().max(20).optional().default('0000000000'),
});

// @route   POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
  // Validate input
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid input';
    return res.status(400).json({ message: firstError });
  }

  const { email, password } = parsed.data;

  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, password, role, name, username, school_id, schools(name)')
      .eq('email', email.trim().toLowerCase())
      .limit(1);

    if (error) {
      console.error('Supabase Login Error:', error);
      return res.status(500).json({ message: 'Database error. Please try again.' });
    }

    if (!users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role, schoolId: user.school_id },
      SAFE_SECRET,
      { expiresIn: '30d' }
    );

    // Handle Supabase join result (which can be an object or a single-item array)
    const schoolName = Array.isArray(user.schools) 
      ? user.schools[0]?.name 
      : (user.schools?.name || 'EduStream Institution');

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        school: schoolName
      }
    });
  } catch (error) {
    console.error('[Auth] Login error:', error);
    res.status(500).json({ message: 'Server error. Please try again.' });
  }
});

// @route   POST /api/auth/signup
router.post('/signup', authLimiter, async (req, res) => {
  // Validate input
  const parsed = signupSchema.safeParse(req.body);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Invalid input';
    return res.status(400).json({ message: firstError });
  }

  const { name, email, password, schoolName, phone } = parsed.data;
  
  try {
    // 1. Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email.trim().toLowerCase())
      .limit(1);

    if (existing && existing.length > 0) {
      return res.status(400).json({ message: 'An account with this email already exists' });
    }

    // 2. Create the school first
    const { data: school, error: sErr } = await supabase
      .from('schools')
      .insert([{ name: schoolName.trim(), address: 'Not Provided', phone: phone.trim() }])
      .select()
      .single();

    if (sErr) throw sErr;

    // 3. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4. Create the admin user
    const { data: user, error: uErr } = await supabase
      .from('users')
      .insert([{
        name: name.trim(),
        username: email.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
        school_id: school.id
      }])
      .select('id, email, username, password, role, name, school_id')
      .single();

    if (uErr) {
      // Rollback school creation on error to prevent orphan records
      await supabase.from('schools').delete().eq('id', school.id);
      throw uErr;
    }

    // 5. Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role, schoolId: school.id },
      SAFE_SECRET,
      { expiresIn: '30d' }
    );

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        school: school.name
      }
    });
  } catch (error) {
    console.error('Signup Error:', error);
    if (error.code === '23505') {
       return res.status(400).json({ message: 'Email or Institution name already exists' });
    }
    res.status(500).json({ message: 'Registration failed. Please try again.' });
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, school_id, schools(name)')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;

    const schoolName = Array.isArray(data.schools) 
      ? data.schools[0]?.name 
      : (data.schools?.name || 'EduStream Institution');

    res.json({
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role,
      school: schoolName
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
