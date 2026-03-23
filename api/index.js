import app from '../server/server.js';

export default function handler(req, res) {
  // Normalize URLs to /api for internal express routing
  if (req.url.startsWith('/server-api')) {
    req.url = req.url.replace('/server-api', '/api');
  }
  return app(req, res);
}
