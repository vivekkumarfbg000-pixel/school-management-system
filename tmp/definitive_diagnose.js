import axios from 'axios';

const BASE_URL = 'https://edustream-saas.vercel.app/api';

async function definitiveDiagnose() {
  console.log('--- 🛡️ Definitive Production Diagnostic ---');
  
  const endpoints = ['/login', '/signup', '/auth/login', '/auth/signup'];
  const methods = ['GET', 'POST', 'OPTIONS'];
  
  for (const endpoint of endpoints) {
    for (const method of methods) {
      const url = `${BASE_URL}${endpoint}`;
      console.log(`\nTesting [${method}] ${url}`);
      try {
        const response = await axios({
          method,
          url,
          data: method === 'POST' ? { email: 'test@example.com', password: 'password' } : undefined,
          validateStatus: () => true,
          headers: {
            'Content-Type': 'application/json'
          }
        });

        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        
        if (response.headers['content-type']?.includes('text/html')) {
          console.log('⚠️  Warning: Received HTML! This endpoint is hit by a static asset handler.');
        }

      } catch (err) {
        console.log('💥 Request Exception:', err.message);
      }
    }
  }
}

definitiveDiagnose();
