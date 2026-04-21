-- =================================================================================
-- EDUSTREAM SAAS — PHASE 1 MIGRATION (April 2026)
-- New tables: enquiries, expenses, visitors, fee_reminders, notifications_log
-- Run this AFTER final_supabase_schema.sql in your Supabase SQL Editor
-- =================================================================================

-- 1. ADMISSION ENQUIRY CRM
CREATE TABLE IF NOT EXISTS enquiries (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  student_name TEXT NOT NULL,
  parent_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  class_applied TEXT NOT NULL,
  source TEXT DEFAULT 'walk-in', -- 'walk-in', 'website', 'referral', 'social-media', 'ad'
  status TEXT DEFAULT 'New', -- New, Contacted, Test Scheduled, Admitted, Lost
  follow_up_date TIMESTAMPTZ,
  notes TEXT,
  lost_reason TEXT, -- Why they didn't admit (track to improve)
  assigned_to TEXT, -- Staff member handling
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_enquiries_school ON enquiries(school_id);
CREATE INDEX IF NOT EXISTS idx_enquiries_status ON enquiries(status);

-- 2. EXPENSE TRACKER (P&L)
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  category TEXT NOT NULL, -- 'Salary', 'Electricity', 'Maintenance', 'Events', 'Supplies', 'Rent', 'Other'
  description TEXT NOT NULL,
  amount FLOAT NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  paid_to TEXT,
  payment_mode TEXT DEFAULT 'Cash', -- Cash, Bank Transfer, UPI, Cheque
  receipt_url TEXT,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  created_by TEXT, -- user id
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_expenses_school ON expenses(school_id);
CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);

-- 3. VISITOR LOG
CREATE TABLE IF NOT EXISTS visitors (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  phone TEXT,
  purpose TEXT NOT NULL, -- 'Parent Meeting', 'Interview', 'Inspection', 'Delivery', 'Other'
  whom_to_meet TEXT NOT NULL,
  check_in TIMESTAMPTZ DEFAULT NOW(),
  check_out TIMESTAMPTZ,
  id_proof TEXT, -- Aadhaar, PAN, DL
  photo_url TEXT,
  remarks TEXT,
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_visitors_school ON visitors(school_id);
CREATE INDEX IF NOT EXISTS idx_visitors_date ON visitors(check_in);

-- 4. FEE REMINDER LOG (tracks every auto-reminder sent)
CREATE TABLE IF NOT EXISTS fee_reminders (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  fee_id TEXT NOT NULL REFERENCES fees(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'pre-due-7', 'pre-due-3', 'on-due', 'overdue-7', 'overdue-15', 'overdue-30'
  channel TEXT NOT NULL, -- 'whatsapp', 'sms'
  phone TEXT NOT NULL,
  message_preview TEXT,
  status TEXT DEFAULT 'sent', -- sent, delivered, read, failed
  message_id TEXT, -- Platform message ID for delivery tracking
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_reminders_student ON fee_reminders(student_id);
CREATE INDEX IF NOT EXISTS idx_reminders_fee ON fee_reminders(fee_id);

-- 5. NOTIFICATION LOG (general audit trail of all comms sent)
CREATE TABLE IF NOT EXISTS notifications_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  type TEXT NOT NULL, -- 'fee_reminder', 'absent_alert', 'broadcast', 'exam_notice', 'fee_receipt'
  channel TEXT NOT NULL, -- 'whatsapp', 'sms', 'in-app'
  recipient_phone TEXT,
  recipient_name TEXT,
  message TEXT,
  status TEXT DEFAULT 'sent',
  school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  sent_by TEXT, -- user id or 'system'
  sent_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notif_school ON notifications_log(school_id);
CREATE INDEX IF NOT EXISTS idx_notif_type ON notifications_log(type);

-- =================================================================================
-- UPDATE schools table with extra metadata for subscription/plan features
-- =================================================================================
ALTER TABLE schools ADD COLUMN IF NOT EXISTS plan TEXT DEFAULT 'trial'; -- trial, starter, growth, premium
ALTER TABLE schools ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '90 days');
ALTER TABLE schools ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS sms_credits INT DEFAULT 500;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS established_year INT;
ALTER TABLE schools ADD COLUMN IF NOT EXISTS board TEXT DEFAULT 'CBSE'; -- CBSE, ICSE, State Board

-- =================================================================================
-- UPDATE fees table: add Razorpay payment link tracking
-- =================================================================================
ALTER TABLE fees ADD COLUMN IF NOT EXISTS payment_link TEXT;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS payment_link_id TEXT;
ALTER TABLE fees ADD COLUMN IF NOT EXISTS razorpay_payment_id TEXT;
