const { generateWithGemini } = require('./gemini-service');
const { checkRequest } = require('./request-guard');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  const guard = checkRequest(req, req.body || {});
  Object.entries(guard.headers || {}).forEach(([key, value]) => res.setHeader(key, value));
  if (!guard.ok) {
    res.status(guard.status).json(guard.body);
    return;
  }

  try {
    const result = await generateWithGemini(req.body || {});
    if (result.status === 200 && result.body?.usage) {
      console.log('[AI_USAGE]', JSON.stringify({ task: req.body?.task, model: result.body.model, ...result.body.usage }));
    }
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error('AI request failed:', error?.message || error);
    res.status(500).json({ error: 'AI request failed.' });
  }
};
