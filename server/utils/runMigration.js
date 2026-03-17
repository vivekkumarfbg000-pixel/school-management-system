import dotenv from 'dotenv';
import pg from 'pg';
const { Pool } = pg;
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: `postgresql://postgres.rfdmnjshizseimkwselc:${process.env.SUPABASE_SERVICE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false }
});

const sql = fs.readFileSync(path.join(__dirname, '../prisma/supabase_schema_fixed.sql'), 'utf8');

async function run() {
  const client = await pool.connect();
  try {
    console.log('Connected to Supabase PostgreSQL...');
    await client.query(sql);
    console.log('✅ Schema migration complete! All tables created successfully.');
  } catch (err) {
    console.error('❌ Migration error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
