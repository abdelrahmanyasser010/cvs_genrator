const WINDOW_MS = Number(process.env.AI_RATE_WINDOW_MS || 10 * 60 * 1000);
const MAX_REQUESTS = Number(process.env.AI_RATE_MAX || 12);
const MAX_BODY_BYTES = Number(process.env.AI_MAX_BODY_BYTES || 18000);
const buckets = global.__CV_AI_RATE_BUCKETS__ || new Map();
global.__CV_AI_RATE_BUCKETS__ = buckets;

function clientIp(req) {
  const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
  return forwarded || req.socket?.remoteAddress || 'unknown';
}

function validSession(value) {
  return /^[a-zA-Z0-9_-]{16,80}$/.test(String(value || ''));
}

function sameOrigin(req) {
  const origin = String(req.headers?.origin || '').trim();
  if (!origin) return true; // Non-browser/local development.
  const host = String(req.headers?.host || '').trim();
  if (!host) return false;
  try {
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

function checkRequest(req, body) {
  const serialized = JSON.stringify(body || {});
  if (Buffer.byteLength(serialized, 'utf8') > MAX_BODY_BYTES) {
    return { ok: false, status: 413, body: { error: 'AI request is too large.' } };
  }
  if (!sameOrigin(req)) {
    return { ok: false, status: 403, body: { error: 'Cross-origin AI requests are not allowed.' } };
  }
  if (String(req.headers?.['x-cv-client'] || '') !== 'web-v1') {
    return { ok: false, status: 403, body: { error: 'Invalid client.' } };
  }
  const session = String(req.headers?.['x-cv-session'] || '');
  if (!validSession(session)) {
    return { ok: false, status: 400, body: { error: 'Missing or invalid session.' } };
  }

  const now = Date.now();
  const key = `${clientIp(req)}:${session}`;
  const current = buckets.get(key);
  const bucket = !current || now >= current.resetAt
    ? { count: 0, resetAt: now + WINDOW_MS }
    : current;
  bucket.count += 1;
  buckets.set(key, bucket);

  // Opportunistic cleanup for long-lived local/server processes.
  if (buckets.size > 5000) {
    for (const [bucketKey, value] of buckets) if (now >= value.resetAt) buckets.delete(bucketKey);
  }

  const remaining = Math.max(0, MAX_REQUESTS - bucket.count);
  if (bucket.count > MAX_REQUESTS) {
    return {
      ok: false,
      status: 429,
      headers: { 'Retry-After': String(Math.ceil((bucket.resetAt - now) / 1000)), 'X-RateLimit-Remaining': '0' },
      body: { error: 'AI request limit reached. Please try again later.' }
    };
  }

  return { ok: true, headers: { 'X-RateLimit-Remaining': String(remaining) } };
}

module.exports = { checkRequest };
