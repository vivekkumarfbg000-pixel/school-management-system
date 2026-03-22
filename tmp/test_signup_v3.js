import supabase from '../api/utils/supabaseClient.js';
import bcrypt from 'bcryptjs';

async function testSignupFlow() {
  console.log('--- 🧪 Detailed Signup Flow Test ---');
  const testEmail = `test_admin_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  const schoolName = 'Test Academy ' + Date.now();

  try {
    // 1. Create School
    console.log('Step 1: Creating school...');
    const { data: school, error: sErr } = await supabase
      .from('schools')
      .insert([{ name: schoolName, address: 'Test Address', phone: '1234567890' }])
      .select()
      .single();

    if (sErr) {
      console.error('❌ School Creation Failed:', sErr);
      return;
    }
    console.log('✅ School Created:', school.id);

    // 2. Hash Password
    const hashedPassword = await bcrypt.hash(testPassword, 10);

    // 3. Create Admin User
    console.log('Step 2: Creating admin user...');
    const { data: user, error: uErr } = await supabase
      .from('users')
      .insert([{
        name: 'Test Admin',
        username: testEmail,
        email: testEmail,
        password: hashedPassword,
        role: 'ADMIN',
        school_id: school.id
      }])
      .select()
      .single();

    if (uErr) {
      console.error('❌ User Creation Failed:', uErr);
      // Cleanup school if user creation fails
      await supabase.from('schools').delete().eq('id', school.id);
      return;
    }
    console.log('✅ Admin User Created:', user.id);

    // 4. Cleanup
    console.log('Cleaning up test data...');
    await supabase.from('users').delete().eq('id', user.id);
    await supabase.from('schools').delete().eq('id', school.id);
    console.log('🎉 Signup flow works perfectly!');

  } catch (err) {
    console.error('💥 Crash during signup test:', err);
  }
}

testSignupFlow();
