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
  const errorMsg = '❌ Invalid environment variables: ' + JSON.stringify(parsed.error.format());
  console.error(errorMsg);
  // In serverless, we shouldn't call process.exit(1) as it might prevent logs from being captured.
  // We'll throw an error instead, which Vercel will log as a function crash.
  throw new Error(errorMsg);
}

export const env = sanitizeEnv(parsed.data);
