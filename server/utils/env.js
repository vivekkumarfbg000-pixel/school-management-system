import { z } from 'zod';
import dotenv from 'dotenv';

import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const envSchema = z.object({
  PORT: z.string().default('5000'),
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  SUPABASE_KEY: z.string().min(1).optional(),
  JWT_SECRET: z.string().min(1).default('fallback_secret'),
  SMS_PROVIDER: z.enum(['MOCK', 'MSG91', 'FAST2SMS', 'TWILIO']).default('MOCK'),
  GROQ_API_KEY: z.string().min(1),
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
}).refine((data) => data.SUPABASE_SERVICE_KEY || data.SUPABASE_KEY, {
  message: "Either SUPABASE_SERVICE_KEY or SUPABASE_KEY must be provided",
  path: ["SUPABASE_SERVICE_KEY"],
});

const sanitizeEnv = (data) => ({
  ...data,
  SUPABASE_SERVICE_KEY: data.SUPABASE_SERVICE_KEY || data.SUPABASE_KEY,
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  const errorMsg = '❌ CRITICAL: Invalid environment variables detected!\n' + 
    'Please ensure all required variables are set in your Vercel Dashboard.\n' +
    'Missing/Invalid fields: ' + JSON.stringify(parsed.error.format());
  console.error(errorMsg);
  // We'll allow the app to continue so that the 500 error can be caught by Express
  // or the health check, rather than crashing the entire import.
}

export const env = parsed.success ? sanitizeEnv(parsed.data) : {
  PORT: process.env.PORT || '5000',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY || '',
  JWT_SECRET: process.env.JWT_SECRET || 'fallback_secret',
  SMS_PROVIDER: process.env.SMS_PROVIDER || 'MOCK',
  GROQ_API_KEY: process.env.GROQ_API_KEY || '',
  RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID || '',
  RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET || '',
};
