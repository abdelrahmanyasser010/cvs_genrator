const { generateWithGemini } = require('./gemini-service');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed.' });
    return;
  }

  try {
    const result = await generateWithGemini(req.body || {});
    res.status(result.status).json(result.body);
  } catch (error) {
    res.status(500).json({ error: error.message || 'AI request failed.' });
  }
};
