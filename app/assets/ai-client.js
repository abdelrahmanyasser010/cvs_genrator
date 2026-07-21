/**
 * Production browser AI client.
 * Sends task-based, privacy-minimized payloads only to the same-origin server.
 */
const AIClient = (function () {
  const SESSION_KEY = 'cv_studio_ai_session';

  function configured() { return true; }

  function sessionId() {
    let value = sessionStorage.getItem(SESSION_KEY);
    if (!value) {
      const bytes = new Uint8Array(18);
      crypto.getRandomValues(bytes);
      value = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(SESSION_KEY, value);
    }
    return value;
  }

  function profile(career) {
    return {
      field: career?.careerProfile?.field || 'other',
      specialization: career?.careerProfile?.specialization || '',
      level: career?.careerProfile?.level || 'junior',
      years: career?.careerProfile?.years || '',
      targetTitle: career?.personalInfo?.title || ''
    };
  }

  function skillList(career) {
    return Object.values(career?.skills || {}).flat().map(String).filter(Boolean).slice(0, 24);
  }

  function experience(career) {
    return (career?.experience || []).slice(0, 8).map(item => ({
      role: item.role || '',
      bullets: (item.bullets || []).slice(0, 8)
    }));
  }

  function locale(career) {
    return career?.meta?.locale === 'ar' ? 'ar' : 'en';
  }

  function previewPayload(payload) {
    if (typeof AISettings === 'undefined' || !AISettings.shouldShowPreview()) return Promise.resolve(true);
    const isAr = payload.locale === 'ar';
    const safe = JSON.stringify(payload, null, 2);
    return Promise.resolve(confirm(`${isAr ? 'البيانات التي سترسل للمساعد:' : 'Data that will be sent to AI:'}\n\n${safe}\n\n${isAr ? 'هل تريد المتابعة؟' : 'Continue?'}`));
  }

  async function request(payload) {
    if (typeof AISettings !== 'undefined' && !(await AISettings.ensureConsent())) return null;
    if (!(await previewPayload(payload))) return null;

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CV-Client': 'web-v1',
        'X-CV-Session': sessionId()
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (data?.fallback) return null;
    if (!response.ok || data?.error) {
      const error = new Error(String(data?.error || `AI request failed (${response.status})`));
      error.status = response.status;
      throw error;
    }
    return data?.text?.trim() || null;
  }

  async function generateSummary(career) {
    return request({
      task: 'summary',
      locale: locale(career),
      profile: profile(career),
      existingSkills: skillList(career)
    });
  }

  async function improveText(career, text, instruction) {
    const looksLikeTranslation = /^translate\b/i.test(String(instruction || '').trim());
    return request({
      task: looksLikeTranslation ? 'translate' : 'improve_text',
      locale: looksLikeTranslation ? (locale(career) === 'ar' ? 'en' : 'ar') : locale(career),
      profile: profile(career),
      existingSkills: skillList(career),
      currentText: String(text || '').slice(0, 5000),
      instruction: looksLikeTranslation ? '' : String(instruction || '').slice(0, 500)
    });
  }

  async function improveBullets(career) {
    const raw = await request({
      task: 'improve_bullets',
      locale: locale(career),
      profile: profile(career),
      existingSkills: skillList(career),
      experience: experience(career)
    });
    if (!raw) return null;
    const json = extractJson(raw);
    return Array.isArray(json) ? json : null;
  }

  async function suggestSkills(career) {
    const raw = await request({
      task: 'suggest_skills',
      locale: locale(career),
      profile: profile(career),
      existingSkills: skillList(career)
    });
    if (!raw) return null;
    const json = extractJson(raw);
    if (Array.isArray(json)) return json.map(String).filter(Boolean).slice(0, 10);
    return String(raw).split(/\r?\n|,/).map(item => item.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, 10);
  }

  function extractJson(text) {
    try { return JSON.parse(text); } catch { /* continue */ }
    const match = String(text || '').match(/\[[\s\S]*\]/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }

  return { configured, generateSummary, improveText, improveBullets, suggestSkills };
})();
