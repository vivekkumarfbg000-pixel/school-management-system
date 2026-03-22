-- =================================================================================
-- EDUSTREAM SAAS V3 - DEFINITIVE SUPABASE SQL MASTER DEFINITION
-- Description: Run this file entirely in your Supabase SQL Editor.
-- This ensures all V2 and V3 features (ML Dashboards, Clash-Free Timetables,
-- Student Portals, and Razorpay integrations) function flawlessly.
-- =================================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. MASTER ENTITIES (TENANT DEFINITIONS)
CREATE TABLE IF NOT EXISTS schools (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  affiliation_no TEXT,
  logo_url TEXT,
  phone TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS academic_sessions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  username TEXT UNIQUE, -- CRITICAL: Maps Admin Logins OR Student admission_no
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL, -- Enum: ADMIN, STAFF, STUDENT, PARENT
  name TEXT NOT NULL,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE
);

-- 3. CORE SCHOOL SYSTEM
CREATE TABLE IF NOT EXISTS students (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  admission_no TEXT UNIQUE NOT NULL, -- Ties to users.username for Portal access
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
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  subjects TEXT, -- Used by V3 Timetable Engine to aggregate logic
  status TEXT DEFAULT 'Active',
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE
);

-- 4. ATTENDANCE CLUSTER
CREATE TABLE IF NOT EXISTS attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  status TEXT NOT NULL,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  marked_by TEXT NOT NULL,
  UNIQUE(student_id, date)
);

CREATE TABLE IF NOT EXISTS staff_attendance (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  date DATE NOT NULL,
  check_in TIMESTAMPTZ,
  check_out TIMESTAMPTZ,
  status TEXT NOT NULL,
  staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  UNIQUE(staff_id, date)
);

-- 5. FINANCE CLUSTER (Used by Razorpay & Dashboards)
CREATE TABLE IF NOT EXISTS fee_structures (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  class_name TEXT NOT NULL,
  fee_type TEXT NOT NULL,
  amount FLOAT NOT NULL,
  cycle TEXT NOT NULL,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS fees (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  amount FLOAT NOT NULL,
  paid_amount FLOAT DEFAULT 0,
  late_fee FLOAT DEFAULT 0,
  status TEXT NOT NULL, -- Pending, Paid, Partial
  due_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,
  fee_type TEXT NOT NULL,
  receipt_no TEXT, -- Mapped to Razorpay ID
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

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
  staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ACADEMICS & TIMETABLE CLUSTER (V3 INNOVATIONS)
CREATE TABLE IF NOT EXISTS exams (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  class_name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS exam_marks (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  subject TEXT NOT NULL,
  max_marks FLOAT NOT NULL,
  obtained FLOAT NOT NULL,
  grade TEXT,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id TEXT NOT NULL REFERENCES exams(id) ON DELETE CASCADE
);

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
  staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE
);

-- 7. OPERATIONS CLUSTER (TRANSPORT & LIBRARY)
CREATE TABLE IF NOT EXISTS vehicles (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  vehicle_no TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL,
  capacity INT NOT NULL,
  driver_name TEXT NOT NULL,
  driver_phone TEXT NOT NULL,
  route_name TEXT NOT NULL,
  stops TEXT NOT NULL,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE
);

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
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS book_issues (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  issue_date TIMESTAMPTZ DEFAULT NOW(),
  due_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ,
  fine FLOAT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Issued',
  book_id TEXT NOT NULL REFERENCES books(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS leaves (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL,
  from_date TIMESTAMPTZ NOT NULL,
  to_date TIMESTAMPTZ NOT NULL,
  days INT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'Pending',
  staff_id TEXT NOT NULL REFERENCES staff(id) ON DELETE CASCADE
);

-- =================================================================================
-- PERFORMANCE INDEX EXECUTIONS
-- These drastically speed up the V3 Machine Learning Analytics aggregation queues.
-- =================================================================================
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_students_school ON students(school_id);
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_name, section);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student ON attendance(student_id);
CREATE INDEX IF NOT EXISTS idx_fees_status ON fees(status);
CREATE INDEX IF NOT EXISTS idx_timetable_class ON timetable_slots(class_name, section);
