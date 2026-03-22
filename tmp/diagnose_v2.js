import axios from 'axios';

const BASE_URL = 'https://edustream-saas.vercel.app/api';

async function diagnose() {
  console.log('--- 🌐 Production API Diagnostic V2 ---');
  
  const endpoints = ['/login', '/signup', '/auth/login', '/auth/signup'];
  
  for (const endpoint of endpoints) {
    const url = `${BASE_URL}${endpoint}`;
    console.log(`\nTesting: ${url}`);
    try {
      const response = await axios.post(url, {
        email: 'test@example.com',
        password: 'password'
      }, {
        validateStatus: () => true
      });
      console.log('Status:', response.status);
      console.log('Content-Type:', response.headers['content-type']);
      console.log('Data Snippet:', JSON.stringify(response.data).substring(0, 100));
    } catch (err) {
      console.log('Error:', err.message);
    }
  }
}

diagnose();
