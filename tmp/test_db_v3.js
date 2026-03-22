import supabase from '../api/utils/supabaseClient.js';

async function testConnection() {
  console.log('--- Supabase Connection Test ---');
  try {
    // 1. Test Fetching Schools
    const { data: schools, error: sError } = await supabase.from('schools').select('id, name').limit(1);
    if (sError) {
      console.error('❌ Error fetching schools:', sError.message);
    } else {
      console.log('✅ Successfully connected to Supabase. Schools found:', schools.length);
    }

    // 2. Test User Table Access
    const { data: users, error: uError } = await supabase.from('users').select('id, email').limit(1);
    if (uError) {
      console.error('❌ Error fetching users:', uError.message);
    } else {
      console.log('✅ Successfully accessed Users table. Users found:', users.length);
    }

    // 3. Check for specific table 'academic_sessions' (a V3 table)
    const { data: sessions, error: sesError } = await supabase.from('academic_sessions').select('id').limit(1);
     if (sesError) {
      console.error('❌ Error accessing academic_sessions (V3 table):', sesError.message);
    } else {
      console.log('✅ Target database appears to have V3 schema (academic_sessions present).');
    }

  } catch (err) {
    console.error('💥 Unexpected crash during test:', err);
  }
}

testConnection();
