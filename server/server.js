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
app.use('/api/auth', authRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/academics', academicRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/payroll', payrollRoutes);
app.use('/api/timetable', timetableRoutes);
app.use('/api/transport', transportRoutes);
app.use('/api/library', libraryRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/pay', payRoutes);
app.use('/api/portal', portalRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'EduStream SaaS API is running ✅', database: 'Supabase PostgreSQL' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Server error', error: err.message });
});

const PORT = env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 Database: Supabase (${env.SUPABASE_URL})`);
});

export default app;
