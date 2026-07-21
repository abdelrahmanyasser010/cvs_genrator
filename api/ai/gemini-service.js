const DEFAULT_MODEL = 'gemini-2.5-flash';
const DEFAULT_FALLBACK_MODELS = ['gemini-2.5-flash', 'gemini-flash-latest'];
const RETRYABLE_STATUS = new Set([404, 429, 500, 502, 503, 504]);
const REQUEST_TIMEOUT_MS = Number(process.env.AI_TIMEOUT_MS || 20000);
const { buildPrompt } = require('./task-prompts');

function json(status, body) {
  return { status, body };
}

function getApiKey() {
  return process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || '';
}

async function generateWithGemini(input) {
  const apiKey = getApiKey();
  if (!apiKey) {
    return json(200, {
      fallback: true,
      error: 'AI is not configured on the server. Set GEMINI_API_KEY.'
    });
  }

  let task;
  try {
    task = buildPrompt(input || {});
  } catch (error) {
    return json(error.statusCode || 400, { error: error.message || 'Invalid AI task.' });
  }

  const models = modelCandidates();
  let lastError = null;
  for (const model of models) {
    const result = await callGeminiModel(apiKey, model, task);
    if (result.status === 200) return result;
    lastError = result;
    if (!RETRYABLE_STATUS.has(result.status)) break;
  }

  return lastError || json(502, { error: 'Gemini request failed.' });
}

function modelCandidates() {
  return [...new Set([
    process.env.GEMINI_MODEL,
    ...(process.env.GEMINI_FALLBACK_MODELS || '').split(','),
    DEFAULT_MODEL,
    ...DEFAULT_FALLBACK_MODELS
  ].map(model => String(model || '').trim()).filter(Boolean))];
}

async function callGeminiModel(apiKey, model, task) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{ parts: [{ text: task.prompt }] }],
        generationConfig: {
          temperature: task.temperature,
          maxOutputTokens: task.maxOutputTokens,
          candidateCount: 1
        },
        safetySettings: [
          { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
          { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' }
        ]
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
    const usage = data?.usageMetadata ? {
      promptTokens: Number(data.usageMetadata.promptTokenCount || 0),
      outputTokens: Number(data.usageMetadata.candidatesTokenCount || 0),
      totalTokens: Number(data.usageMetadata.totalTokenCount || 0)
    } : undefined;
    return json(200, { text, model, usage });
  } catch (error) {
    if (error?.name === 'AbortError') return json(504, { error: 'AI request timed out.', model });
    return json(503, { error: error.message || 'Gemini is unavailable.', model });
  } finally {
    clearTimeout(timer);
  }
}

module.exports = { generateWithGemini };
