const DEFAULT_MODEL = 'gemini-3.1-flash-lite';
const DEFAULT_FALLBACK_MODELS = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'];
const MAX_PROMPT_CHARS = 12000;
const RETRYABLE_STATUS = new Set([404, 429, 500, 502, 503, 504]);

function json(status, body) {
  return { status, body };
}

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
}

async function generateWithGemini({ prompt, options = {} }) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return json(200, {
      fallback: true,
      error: 'AI is not configured on the server. Set GEMINI_API_KEY.'
    });
  }

  const cleanPrompt = String(prompt || '').trim();
  if (!cleanPrompt) return json(400, { error: 'Missing prompt.' });
  if (cleanPrompt.length > MAX_PROMPT_CHARS) {
    return json(413, { error: 'Prompt is too large.' });
  }

  const models = modelCandidates(options.model);
  const temperature = Number.isFinite(options.temperature)
    ? Math.max(0, Math.min(1, options.temperature))
    : 0.4;

  let lastError = null;
  for (const model of models) {
    const result = await callGeminiModel(apiKey, model, cleanPrompt, temperature);
    if (result.status === 200) return result;
    lastError = result;
    if (!RETRYABLE_STATUS.has(result.status)) break;
  }

  return lastError || json(502, { error: 'Gemini request failed.' });
}

function modelCandidates(requestedModel) {
  const configured = [
    requestedModel,
    process.env.GEMINI_MODEL,
    ...(process.env.GEMINI_FALLBACK_MODELS || '').split(','),
    ...DEFAULT_FALLBACK_MODELS
  ]
    .map(model => String(model || '').trim())
    .filter(Boolean);
  return [...new Set(configured)];
}

async function callGeminiModel(apiKey, model, prompt, temperature) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature }
      })
    });

    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      return json(response.status, {
        error: data?.error?.message || `Gemini request failed (${response.status})`,
        model
      });
    }

    const text = data?.candidates?.[0]?.content?.parts
      ?.map(part => part.text || '')
      .join('')
      .trim();

    if (!text) return json(502, { error: 'Gemini returned an empty response.', model });
    return json(200, { text, model });
  } catch (error) {
    return json(503, { error: error.message || 'Gemini is unavailable.', model });
  }
}

module.exports = { generateWithGemini };
