/**
 * Browser AI client for owner-managed AI.
 * Calls the internal /api/ai/generate endpoint first, then falls back cleanly.
 */
const AIClient = (function () {
  function configured() {
    return true;
  }

  function provider() {
    return AISettings.getProvider();
  }

  function apiKey() {
    return AISettings.getApiKey();
  }

  function context(career) {
    return {
      profession: career?.careerProfile?.field || 'other',
      level: career?.careerProfile?.level || 'junior',
      locale: career?.meta?.locale || 'en',
      skills: Object.values(career?.skills || {}).flat().slice(0, 12),
      experience: (career?.experience || []).map(item => ({
        role: item.role || '',
        company: item.company || '',
        bullets: item.bullets || []
      })),
      projects: (career?.projects || []).map(item => ({
        name: item.name || '',
        tech: item.tech || '',
        desc: item.desc || ''
      }))
    };
  }

  function guardrails(career) {
    const lang = career?.meta?.locale === 'ar' ? 'Arabic' : 'English';
    return [
      'You are a professional CV writer inside CV Studio.',
      `Write in ${lang}.`,
      'Do not invent companies, dates, degrees, certifications, awards, metrics, or seniority.',
      'Only use facts present in the provided CV data.',
      'If details are missing, write generally without fabricating specifics.',
      'Return only the final CV text, with no markdown heading.'
    ].join('\n');
  }

  async function maybePreview(prompt) {
    if (typeof AISettings !== 'undefined' && AISettings.shouldShowPreview()) {
      return confirm(`Prompt to AI:\n\n${prompt}\n\nSend this prompt?`);
    }
    return true;
  }

  async function complete(prompt, options = {}) {
    if (!(await maybePreview(prompt))) return null;

    const serverText = await callOwnerManagedAI(prompt, options).catch(error => {
      console.warn('Owner-managed AI unavailable:', error);
      return null;
    });
    if (serverText) return serverText;

    if (typeof AISettings !== 'undefined' && AISettings.getProvider() && AISettings.getApiKey()) {
      const name = provider();
      const key = apiKey();
      if (name === 'gemini') return callGemini(key, prompt, options);
      if (name === 'openrouter') return callOpenRouter(key, prompt, options);
      if (name === 'openai') return callOpenAI(key, prompt, options);
      if (name === 'anthropic') return callAnthropic(key, prompt, options);
    }
    return null;
  }

  async function generateSummary(career) {
    const data = context(career);
    const prompt = `${guardrails(career)}

Task: Write a strong professional summary in 2-3 concise sentences.

CV data:
${JSON.stringify(data, null, 2)}`;
    return complete(prompt, { temperature: 0.45 });
  }

  async function improveText(career, text, instruction) {
    const prompt = `${guardrails(career)}

Task: ${instruction || 'Improve this CV text to be clearer, more specific, and more professional.'}

Current text:
${text || ''}

CV context:
${JSON.stringify(context(career), null, 2)}`;
    return complete(prompt, { temperature: 0.35 });
  }

  async function improveBullets(career) {
    const prompt = `${guardrails(career)}

Task: Rewrite the provided experience bullets to be action-oriented and ATS-friendly.
Rules:
- Keep the same number of roles.
- Do not add fake metrics.
- Use concise bullet lines.
- Return JSON only in this shape: [{"role":"...","bullets":["..."]}]

Experience:
${JSON.stringify(context(career).experience, null, 2)}`;
    const raw = await complete(prompt, { temperature: 0.25 });
    if (!raw) return null;
    const json = extractJson(raw);
    return Array.isArray(json) ? json : null;
  }

  async function suggestSkills(career) {
    const data = context(career);
    const prompt = `${guardrails(career)}

Task: Suggest 8-10 relevant CV skills for this profession and level.
Rules:
- Match the selected profession, not software unless the profession is software.
- Do not repeat existing skills.
- Return JSON only in this shape: ["Skill 1","Skill 2"]

CV data:
${JSON.stringify(data, null, 2)}`;
    const raw = await complete(prompt, { temperature: 0.3 });
    if (!raw) return null;
    const json = extractJson(raw);
    if (Array.isArray(json)) return json.map(String).filter(Boolean);
    return String(raw)
      .split(/\r?\n|,/)
      .map(item => item.replace(/^[-*\d.\s]+/, '').trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  function extractJson(text) {
    try { return JSON.parse(text); } catch { /* continue */ }
    const match = String(text || '').match(/\[[\s\S]*\]/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }

  async function callOwnerManagedAI(prompt, options) {
    const res = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, options })
    });
    if (res.status === 404 || res.status === 501) return null;
    const data = await readResponse(res);
    if (data?.fallback || data?.error) return null;
    return data?.text?.trim() || null;
  }

  async function callGemini(key, prompt, options) {
    const model = localStorage.getItem('cv_studio_ai_model') || 'gemini-2.5-flash';
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: options.temperature ?? 0.4 }
      })
    });
    const data = await readResponse(res);
    return data?.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('').trim() || null;
  }

  async function callOpenAI(key, prompt, options) {
    const model = localStorage.getItem('cv_studio_ai_model') || 'gpt-4o-mini';
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.4
      })
    });
    const data = await readResponse(res);
    return data?.choices?.[0]?.message?.content?.trim() || null;
  }

  async function callOpenRouter(key, prompt, options) {
    const model = localStorage.getItem('cv_studio_ai_model') || 'openai/gpt-4o-mini';
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        temperature: options.temperature ?? 0.4
      })
    });
    const data = await readResponse(res);
    return data?.choices?.[0]?.message?.content?.trim() || null;
  }

  async function callAnthropic(key, prompt, options) {
    const model = localStorage.getItem('cv_studio_ai_model') || 'claude-3-haiku-20240307';
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': key,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model,
        max_tokens: options.maxTokens || 700,
        temperature: options.temperature ?? 0.4,
        messages: [{ role: 'user', content: prompt }]
      })
    });
    const data = await readResponse(res);
    return data?.content?.map(part => part.text || '').join('').trim() || null;
  }

  async function readResponse(res) {
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = data?.error?.message || data?.error || `AI request failed (${res.status})`;
      throw new Error(String(msg));
    }
    return data;
  }

  return { configured, complete, generateSummary, improveText, improveBullets, suggestSkills };
})();
