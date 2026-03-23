import app from './server.js';

export default function handler(req, res) {
  // Normalize URL for consistency (supports both /api and legacy /server-api)
  if (req.url.startsWith('/server-api')) {
    req.url = req.url.replace('/server-api', '/api');
  }
  return app(req, res);
}
