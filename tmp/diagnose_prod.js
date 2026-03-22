import axios from 'axios';

const PRODUCTION_URL = 'https://edustream-saas.vercel.app/api/auth/signup';

async function diagnoseProduction() {
  console.log('--- 🌐 Production API Diagnostic ---');
  console.log('URL:', PRODUCTION_URL);
  
  try {
    const response = await axios.post(PRODUCTION_URL, {
      name: 'Diagnostic Test',
      email: `diag_${Date.now()}@example.com`,
      password: 'Password123!',
      schoolName: 'Diagnostic Academy'
    }, {
      validateStatus: () => true // Don't throw on error codes
    });

    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    console.log('Headers:', JSON.stringify(response.headers, null, 2));
    console.log('Data:', JSON.stringify(response.data, null, 2));

    if (response.status === 405) {
      console.log('\n💡 405 Method Not Allowed: Vercel might be treating "/api" as a static folder instead of a serverless function.');
    } else if (response.status === 403) {
      console.log('\n💡 403 Forbidden: Potential CORS issue or Vercel security policy blocking the request.');
    } else if (response.status === 500) {
      console.log('\n💡 500 Server Error: The function started but crashed (check logs for DB connection or missing env vars).');
    }

  } catch (err) {
    console.error('💥 Request failed:', err.message);
  }
}

diagnoseProduction();
