import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY
);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, password, schoolName } = req.body;
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

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

    return res.status(201).json({
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
    return res.status(500).json({ message: 'Server error during signup' });
  }
}
