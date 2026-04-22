export default function handler(req, res) {
  res.status(200).json({
    status: 'API is reachable',
    env: process.env.NODE_ENV,
    url: req.url,
    method: req.method,
    headers: req.headers,
    time: new Date().toISOString()
  });
}
