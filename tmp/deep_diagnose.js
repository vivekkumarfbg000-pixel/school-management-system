import axios from 'axios';

const BASE_URL = 'https://edustream-saas.vercel.app/api';

async function deepDiagnose() {
  console.log('--- 🛡️ Deep Production Diagnostic ---');
  
  const endpoints = ['/login', '/signup'];
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
            'Content-Type': 'application/json',
            'X-Debug-Request': 'true'
          }
        });

        console.log('Status:', response.status);
        console.log('Headers:', JSON.stringify(response.headers, null, 2));
        
        const contentType = response.headers['content-type'] || '';
        if (contentType.includes('text/html')) {
          console.log('⚠️  Warning: Received HTML instead of JSON. Request likely hit a static asset or a 404/405 page.');
          console.log('Data Snippet (First 200 chars):', String(response.data).substring(0, 200));
        } else {
          console.log('Data:', JSON.stringify(response.data, null, 2));
        }

      } catch (err) {
        console.log('💥 Request Exception:', err.message);
      }
    }
  }
}

deepDiagnose();
