// Run once to seed the Supabase database with initial school + admin user
// Usage: node utils/seedSupabase.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function seed() {
  console.log('Seeding Supabase database...');

  // 1. Create school
  const { data: school, error: sErr } = await supabase
    .from('schools')
    .insert([{
      name: 'Vidya Bhawan Public School',
      address: '123 Main St, Patna, Bihar',
      phone: '+91 9876543210',
      affiliation_no: 'CBSE/12345/2026',
    }])
    .select()
    .single();

  if (sErr) {
    if (sErr.code === '23505') {
      console.log('School already exists, skipping...');
    } else {
      console.error('Error creating school:', sErr); return;
    }
  } else {
    console.log(`Created school: ${school.name} (${school.id})`);
  }

  // Get school id (if already exists)
  const { data: existingSchools } = await supabase.from('schools').select('id').limit(1);
  const schoolId = school?.id || existingSchools?.[0]?.id;

  if (!schoolId) { console.error('No school found!'); return; }

  // 2. Create Academic Session
  const { error: asErr } = await supabase.from('academic_sessions').insert([{
    name: '2025-26',
    start_date: '2025-04-01',
    end_date: '2026-03-31',
    is_active: true,
    school_id: schoolId
  }]);
  if (asErr && asErr.code !== '23505') console.error('Session error:', asErr);
  else console.log('Academic session created/exists.');

  // 3. Create Admin user
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const { data: user, error: uErr } = await supabase
    .from('users')
    .upsert([{
      username: 'admin',
      password: hashedPassword,
      name: 'System Admin',
      role: 'ADMIN',
      school_id: schoolId
    }], { onConflict: 'username' })
    .select()
    .single();

  if (uErr) console.error('User error:', uErr);
  else console.log(`Admin user created: ${user.username}`);

  // 4. Create sample student
  const { data: student, error: stErr } = await supabase
    .from('students')
    .upsert([{
      admission_no: 'ADM001',
      name: 'Rahul Kumar',
      father_name: 'Sanjay Kumar',
      mother_name: 'Sunita Devi',
      class_name: '10',
      section: 'A',
      dob: '2010-05-15',
      gender: 'Male',
      category: 'General',
      phone: '9876543211',
      address: 'Plot 4, Kankarbagh, Patna',
      school_id: schoolId
    }], { onConflict: 'admission_no' })
    .select()
    .single();

  if (stErr) console.error('Student error:', stErr);
  else console.log(`Sample student created: ${student.name}`);

  // 5. Add a sample fee for the student
  if (student) {
    const { error: fErr } = await supabase.from('fees').insert([{
      amount: 5500,
      fee_type: 'Tuition',
      due_date: '2026-03-31',
      status: 'Pending',
      student_id: student.id
    }]);
    if (fErr && fErr.code !== '23505') console.error('Fee error:', fErr);
    else console.log('Sample fee created.');
  }

  console.log('\n✅ Seeding complete!');
  console.log('Login credentials: admin / admin123');
}

seed().catch(console.error);
