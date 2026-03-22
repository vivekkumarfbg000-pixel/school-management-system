// Runs SQL migrations directly against Supabase via the REST API
// Run once: node utils/migrate.js

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const sql = `
-- Schools
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  affiliation_no TEXT,
  logo_url TEXT,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic Sessions
CREATE TABLE IF NOT EXISTS academic_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  school_id TEXT NOT NULL REFERENCES schools(id)
);

-- Students
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  admission_no TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  father_name TEXT NOT NULL,
  mother_name TEXT NOT NULL,
  class_name TEXT NOT NULL,
  section TEXT NOT NULL,
  dob TIMESTAMPTZ NOT NULL,
  gender TEXT NOT NULL,
  aadhaar TEXT,
  category TEXT NOT NULL,
  is_rte BOOLEAN DEFAULT FALSE,
  phone TEXT NOT NULL,
  address TEXT NOT NULL,
  photo_url TEXT,
  status TEXT DEFAULT 'Active',
  school_id TEXT NOT NULL REFERENCES schools(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES students(id),
  marked_by TEXT NOT NULL,
  UNIQUE(student_id, date)
);

-- Fee Structures
CREATE TABLE IF NOT EXISTS fee_structures (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_name TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  amount FLOAT NOT NULL,
  cycle TEXT NOT NULL,
  school_id TEXT NOT NULL REFERENCES schools(id)
);

-- Fees
CREATE TABLE IF NOT EXISTS fees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  amount FLOAT NOT NULL,
  paid_amount FLOAT DEFAULT 0,
  late_fee FLOAT DEFAULT 0,
  status TEXT NOT NULL,
  due_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,
  fee_type TEXT NOT NULL,
  receipt_no TEXT,
  student_id TEXT NOT NULL REFERENCES students(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exams
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  class_name TEXT NOT NULL
);

-- Exam Marks
CREATE TABLE IF NOT EXISTS exam_marks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subject TEXT NOT NULL,
  max_marks FLOAT NOT NULL,
  obtained FLOAT NOT NULL,
  grade TEXT,
  student_id TEXT NOT NULL REFERENCES students(id),
  exam_id TEXT NOT NULL REFERENCES exams(id)
);

-- Staff
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  staff_id TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  designation TEXT NOT NULL,
  type TEXT NOT NULL,
  qualification TEXT NOT NULL,
  aadhaar TEXT,
  phone TEXT NOT NULL,
  photo_url TEXT,
  basic_salary FLOAT NOT NULL,
  da FLOAT DEFAULT 0,
  hra FLOAT DEFAULT 0,
  allowances FLOAT DEFAULT 0,
  pf_deduction FLOAT DEFAULT 0,
  tds_deduction FLOAT DEFAULT 0,
  joining_date TIMESTAMPTZ NOT NULL,
  subjects TEXT,
  school_id TEXT NOT NULL REFERENCES schools(id)
);

-- Staff Attendance
CREATE TABLE IF NOT EXISTS staff_attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL,
  staff_id TEXT NOT NULL REFERENCES staff(id),
  UNIQUE(staff_id, date)
);

-- Leaves
CREATE TABLE IF NOT EXISTS leaves (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,
  from_date TIMESTAMPTZ NOT NULL,
  to_date TIMESTAMPTZ NOT NULL,
  days INT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  staff_id TEXT NOT NULL REFERENCES staff(id)
);

-- Salary Slips
CREATE TABLE IF NOT EXISTS salary_slips (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  month TEXT NOT NULL,
  gross_salary FLOAT NOT NULL,
  total_deductions FLOAT NOT NULL,
  net_salary FLOAT NOT NULL,
  absent_days INT DEFAULT 0,
  absent_deduction FLOAT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Generated',
  paid_date TIMESTAMPTZ,
  staff_id TEXT NOT NULL REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Timetable Slots
CREATE TABLE IF NOT EXISTS timetable_slots (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  day TEXT NOT NULL,
  period INT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  subject TEXT NOT NULL,
  class_name TEXT NOT NULL,
  section TEXT NOT NULL,
  room TEXT,
  staff_id TEXT NOT NULL REFERENCES staff(id)
);

-- Vehicles
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vehicle_no TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  capacity INT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  route_name TEXT NOT NULL,
  stops TEXT NOT NULL,
  school_id TEXT NOT NULL REFERENCES schools(id)
);

-- Books
CREATE TABLE IF NOT EXISTS books (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  accession_no TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  isbn TEXT,
  category TEXT NOT NULL,
  quantity INT DEFAULT 1,
  available INT DEFAULT 1,
  shelf_location TEXT,
  school_id TEXT NOT NULL REFERENCES schools(id)
);

-- Book Issues
CREATE TABLE IF NOT EXISTS book_issues (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ,
  fine FLOAT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Issued',
  book_id TEXT NOT NULL REFERENCES books(id),
  student_id TEXT NOT NULL REFERENCES students(id)
);

-- Users
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  name TEXT NOT NULL,
  school_id TEXT NOT NULL REFERENCES schools(id)
);
`;

async function migrate() {
  console.log('Running migration against Supabase...');
  const { error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(() => ({ error: 'rpc not found' }));

  if (error) {
    // Fallback: use the REST endpoint directly
    const res = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ sql_query: sql })
    });
    if (!res.ok) {
      console.log('Note: exec_sql RPC not available. Please paste the SQL in the Supabase SQL Editor manually.');
      console.log('\n--- COPY THIS SQL TO SUPABASE SQL EDITOR ---\n');
      console.log(sql);
      return;
    }
  }
  
  console.log('Migration complete!');
}

migrate();
