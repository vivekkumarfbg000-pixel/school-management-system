import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../server/.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function test() {
  const { data, error } = await supabase
    .from('notices')
    .select('*')
    .limit(1);

  if (error) {
    console.error('❌ Table "notices" check failed:', error.message);
  } else {
    console.log('✅ Table "notices" exists and is accessible.');
  }
  
  const { data: vData, error: vError } = await supabase
    .from('vehicles')
    .select('*')
    .limit(1);
    
  if (vError) {
    console.error('❌ Table "vehicles" check failed:', vError.message);
  } else {
    console.log('✅ Table "vehicles" exists.');
  }
}

test();
