import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';

// Environment Helpers
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const app = express();
app.use(cors());
app.use(express.json());

// Auth Logic directly in the handler for maximum Vercel reliability
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, password, role, name, username, school_id')
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
        role: user.role
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/auth/signup', async (req, res) => {
  const { name, email, password, schoolName } = req.body;
  try {
    const { data: school, error: sErr } = await supabase
      .from('schools')
      .insert([{ name: schoolName, address: 'Update Address', phone: '0000000000' }])
      .select()
      .single();

    if (sErr) throw sErr;

    const hashedPassword = await bcrypt.hash(password, 10);
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
      .select()
      .single();

    if (uErr) throw uErr;

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
    res.status(500).json({ message: 'Server error during signup' });
  }
});

export default app;
