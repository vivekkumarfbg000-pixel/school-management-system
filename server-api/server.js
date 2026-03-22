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

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: '*', // Allow all for now to debug, can be restricted later
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Main Entity Routes
app.use('/server-api/auth', authRoutes);
app.use('/server-api/students', studentRoutes);
app.use('/server-api/attendance', attendanceRoutes);
app.use('/server-api/fees', feeRoutes);
app.use('/server-api/academics', academicRoutes);
app.use('/server-api/staff', staffRoutes);
app.use('/server-api/payroll', payrollRoutes);
app.use('/server-api/timetable', timetableRoutes);
app.use('/server-api/transport', transportRoutes);
app.use('/server-api/library', libraryRoutes);
app.use('/server-api/notifications', notificationRoutes);
app.use('/server-api/dashboard', dashboardRoutes);
app.use('/server-api/ai', aiRoutes);
app.use('/server-api/search', searchRoutes);
app.use('/server-api/export', exportRoutes);
app.use('/server-api/reports', reportsRoutes);
app.use('/server-api/settings', settingsRoutes);
app.use('/server-api/pay', payRoutes);
app.use('/server-api/portal', portalRoutes);

// Health check
app.get('/server-api/health', (req, res) => {
  res.json({ status: 'EduStream SaaS API is running ✅', database: 'Supabase PostgreSQL' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  const PORT = env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`📊 Database: Supabase (${env.SUPABASE_URL})`);
  });
}

export default app;
