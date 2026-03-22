import app from './server.js';

// Vercel Serverless Functions often strip the /api prefix or pass it differently.
// We export a handler that ensures the path is correctly prefixed so Express routing works.
export default (req, res) => {
  if (!req.url.startsWith('/api')) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
};
