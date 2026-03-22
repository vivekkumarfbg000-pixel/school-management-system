import express from 'express';
import cors from 'cors';
import authRoutes from '../routes/auth.js';

const app = express();
app.use(cors());
app.use(express.json());

// Mount auth routes directly. 
// Vercel routes /api/auth/login -> this file.
// We need to handle the stripping of /api/auth if Vercel doesn't.
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes); // Fallback

export default app;
