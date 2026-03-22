import app from './server.js';

export default async function handler(req, res) {
  // Ensure the URL is correctly handled by Express mounted at /api
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
}
