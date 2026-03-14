// Runs the complete SQL schema against Supabase using direct PG connection
// Usage: node utils/runMigration.js

require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Supabase allows direct PG connections via the Session pooler on port 5432
// The password in this case is the SERVICE ROLE JWT key
const pool = new Pool({
  connectionString: `postgresql://postgres.rfdmnjshizseimkwselc:${process.env.SUPABASE_SERVICE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres`,
  ssl: { rejectUnauthorized: false }
});

const sql = fs.readFileSync(path.join(__dirname, '../prisma/supabase_schema.sql'), 'utf8');

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
