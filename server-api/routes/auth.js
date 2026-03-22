import express from 'express';
const router = express.Router();
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import supabase from '../utils/supabaseClient.js';
import { protect } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, password, role, name, username, school_id, schools(name)')
      .eq('email', email)
      .limit(1);

    if (error || !users || users.length === 0) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role, schoolId: user.school_id },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        school: user.schools?.name
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/signup
router.post('/signup', async (req, res) => {
  const { name, email, password, schoolName } = req.body;
  
  try {
    // 1. Create the school first
    const { data: school, error: sErr } = await supabase
      .from('schools')
      .insert([{ name: schoolName, address: 'Update Address', phone: '0000000000' }])
      .select()
      .single();

    if (sErr) throw sErr;

    // 2. Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Create the admin user
    const { data: user, error: uErr } = await supabase
      .from('users')
      .insert([{
        name,
        username: email,
        email: email,
        password: hashedPassword,
        role: 'ADMIN',
        school_id: school.id
      }])
      .select('id, email, username, password, role, name, school_id')
      .single();

    if (uErr) throw uErr;

    // 4. Generate token
    const token = jwt.sign(
      { id: user.id, email: user.email, username: user.username, role: user.role, schoolId: school.id },
      JWT_SECRET,
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
    console.error(error);
    if (error.code === '23505') {
       return res.status(400).json({ message: 'Email already exists' });
    }
    res.status(500).json({ message: 'Server error during signup' });
  }
});

// @route   GET /api/auth/me
router.get('/me', protect, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, name, role, school_id')
      .eq('id', req.user.id)
      .single();
    if (error) throw error;
    res.json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
