import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { env } from './utils/env.js';

// Routes
import authRoutes from './routes/auth.js';
import studentRoutes from './routes/students.js';
import attendanceRoutes from './routes/attendance.js';
import feeRoutes from './routes/fees.js';
import academicRoutes from './routes/academics.js';
import staffRoutes from './routes/staff.js';
import payrollRoutes from './routes/payroll.js';
import timetableRoutes from './routes/timetable.js';
import transportRoutes from './routes/transport.js';
import libraryRoutes from './routes/library.js';
import notificationRoutes from './routes/notifications.js';
import dashboardRoutes from './routes/dashboard.js';
import aiRoutes from './routes/ai.js';
import searchRoutes from './routes/search.js';
import exportRoutes from './routes/export.js';
import reportsRoutes from './routes/reports.js';
import settingsRoutes from './routes/settings.js';
import payRoutes from './routes/pay.js';
import portalRoutes from './routes/portal.js';
// Phase 1 — New Routes
import remindersRoutes from './routes/reminders.js';
import enquiriesRoutes from './routes/enquiries.js';
import expensesRoutes from './routes/expenses.js';

dotenv.config();

const app = express();

// Robust path normalization for Vercel & local environments
app.use((req, res, next) => {
  const originalUrl = req.url;
  
  try {
    // Basic parse using a dummy protocol since we only care about paths/queries here
    const parsedUrl = new URL(req.url, `http://localhost`);
    let cleanPath = parsedUrl.pathname;
    
    // 1. Remove common prefixes if they exist (to get the base path)
    if (cleanPath.startsWith('/server-api')) {
      cleanPath = cleanPath.substring(11);
    } else if (cleanPath.startsWith('/api')) {
      cleanPath = cleanPath.substring(4);
    }
    
    // 2. Remove common internal remappings if they exist
    if (cleanPath.startsWith('/index.js')) {
      cleanPath = cleanPath.substring(9);
    }
    
    // 3. Normalize purely to the resource path
    parsedUrl.pathname = cleanPath.startsWith('/') ? cleanPath : '/' + cleanPath;
    req.url = parsedUrl.pathname + parsedUrl.search;
  } catch (err) {
    console.warn('[Routing] Non-fatal URL rewrite error', err);
  }
  
  // Debug log for production (visible in Vercel logs)
  if (originalUrl !== req.url && process.env.NODE_ENV === 'production') {
     console.log(`[Routing] ${req.method} ${originalUrl} -> ${req.url}`);
  }
  
  next();
});

// 2. CORS Middleware - MUST BE BEFORE OTHER MIDDLEWARE FOR PREFLIGHTS
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? [process.env.CLIENT_URL, 'https://edustream.io']
  : '*';

app.use(cors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
  optionsSuccessStatus: 200
}));

// 3. Body Parser
app.use(express.json());

// 4. Request Logging (Production debugging)
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.url !== '/api/health' && duration > 100) {
      console.log(`[API] ${req.method} ${req.url} → ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Main Entity Routes
// Supporting both /api/auth AND /auth for maximum deployment flexibility
const registerRoute = (path, router) => {
  app.use(path, router);
  app.use('/api' + path, router);
};

registerRoute('/auth', authRoutes);
registerRoute('/students', studentRoutes);
registerRoute('/attendance', attendanceRoutes);
registerRoute('/fees', feeRoutes);
registerRoute('/academics', academicRoutes);
registerRoute('/staff', staffRoutes);
registerRoute('/payroll', payrollRoutes);
registerRoute('/timetable', timetableRoutes);
registerRoute('/transport', transportRoutes);
registerRoute('/library', libraryRoutes);
registerRoute('/notifications', notificationRoutes);
registerRoute('/dashboard', dashboardRoutes);
registerRoute('/ai', aiRoutes);
registerRoute('/search', searchRoutes);
registerRoute('/export', exportRoutes);
registerRoute('/reports', reportsRoutes);
registerRoute('/settings', settingsRoutes);
registerRoute('/pay', payRoutes);
registerRoute('/portal', portalRoutes);
// Phase 1 — New Routes
registerRoute('/reminders', remindersRoutes);
registerRoute('/enquiries', enquiriesRoutes);
registerRoute('/expenses', expensesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'EduStream SaaS API is running ✅', database: 'Supabase PostgreSQL' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = env.PORT || 5000;
  app.listen(PORT, async () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Database: Supabase (${env.SUPABASE_URL})`);

    // Start Fee Reminder Cron — runs daily at 8:00 AM IST
    try {
      const cron = await import('node-cron');
      const { runFeeReminderCron } = await import('./utils/reminderCron.js');
      cron.default.schedule('0 8 * * *', runFeeReminderCron, { timezone: 'Asia/Kolkata' });
      console.log(`🔔 Fee reminder cron scheduled — daily at 8:00 AM IST`);
    } catch (e) {
      console.warn('[Cron] node-cron not installed. Run: npm install node-cron');
    }
  });
}

export default app;
