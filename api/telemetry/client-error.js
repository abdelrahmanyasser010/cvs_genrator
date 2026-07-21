const buckets = global.__CV_ERROR_BUCKETS__ || new Map();
global.__CV_ERROR_BUCKETS__ = buckets;

function clip(value, max) {
  return String(value || '').replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]').replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]').slice(0, max);
}

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed.' });
  const origin = String(req.headers?.origin || '');
  const host = String(req.headers?.host || '');
  if (origin) {
    try { if (new URL(origin).host !== host) return res.status(403).json({ error: 'Forbidden.' }); }
    catch { return res.status(403).json({ error: 'Forbidden.' }); }
  }
  const ip = String(req.headers?.['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown').split(',')[0];
  const now = Date.now();
  const bucket = buckets.get(ip) || { count: 0, resetAt: now + 10 * 60 * 1000 };
  if (now > bucket.resetAt) { bucket.count = 0; bucket.resetAt = now + 10 * 60 * 1000; }
  bucket.count += 1;
  buckets.set(ip, bucket);
  if (bucket.count > 8) return res.status(429).json({ error: 'Too many reports.' });

  const body = req.body || {};
  const event = {
    type: clip(body.type, 30),
    message: clip(body.message, 500),
    stack: clip(body.stack, 1800),
    path: clip(body.path, 180),
    viewport: clip(body.viewport, 40),
    build: clip(body.build, 40),
    at: new Date().toISOString()
  };
  console.error('[CLIENT_ERROR]', JSON.stringify(event));
  return res.status(202).json({ accepted: true });
};
