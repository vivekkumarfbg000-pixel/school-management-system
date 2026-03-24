import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnostic() {
  console.log('🔍 Starting Supabase Diagnostic...');
  console.log(`URL: ${supabaseUrl}`);
  
  try {
    // 1. Check connection
    const { data: health, error: healthError } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (healthError) {
      console.error('❌ Failed to connect to "users" table:', healthError.message);
    } else {
      console.log('✅ Successfully connected to "users" table');
    }

    // 2. Check schema and data
    const testEmail = 'vivekkumarfbg000@gmail.com';
    const { data: userWithSchool, error: joinError } = await supabase
      .from('users')
      .select('id, email, school_id, schools(name)')
      .eq('email', testEmail)
      .limit(1);
    
    if (joinError) {
       console.error(`❌ Join error for ${testEmail}:`, joinError.message);
       console.log('💡 Try changing "schools(name)" to "school(name)" or "School(name)"');
    } else if (userWithSchool && userWithSchool.length > 0) {
       console.log(`✅ Success! User found with school:`, userWithSchool[0].schools?.name || 'No school name');
    }

    const { data: countData, error: countError } = await supabase.from('users').select('email');
    if (countData) {
       const total = countData.length;
       const nullEmails = countData.filter(u => !u.email).length;
       console.log(`📊 Total users: ${total}, Users with null email: ${nullEmails}`);
       if (total > 0 && total < 10) {
          console.log('👥 User list (Emails):', countData.map(u => u.email || '[NULL]').join(', '));
       }
    }

    // 3. Check schools relation
    const { data: schoolSample, error: schoolError } = await supabase.from('schools').select('*').limit(1);
     if (schoolError) {
      console.error('❌ Failed to connect to "schools" table:', schoolError.message);
    } else {
      console.log('✅ Successfully connected to "schools" table');
    }

  } catch (err) {
    console.error('💥 Unexpected error during diagnostic:', err.message);
  }
}

diagnostic();
