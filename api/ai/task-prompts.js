const ALLOWED_TASKS = new Set(['summary', 'improve_text', 'improve_bullets', 'suggest_skills', 'translate']);
const MAX_TEXT = 5000;
const MAX_ARRAY = 12;

function clip(value, max = MAX_TEXT) {
  return String(value || '').trim().slice(0, max);
}

function cleanList(value, max = MAX_ARRAY, itemMax = 280) {
  return (Array.isArray(value) ? value : [])
    .slice(0, max)
    .map(item => clip(item, itemMax))
    .filter(Boolean);
}

function cleanProfile(profile = {}) {
  return {
    field: clip(profile.field, 80) || 'other',
    specialization: clip(profile.specialization, 120),
    level: clip(profile.level, 40) || 'junior',
    years: clip(profile.years, 30),
    targetTitle: clip(profile.targetTitle, 140)
  };
}

function sanitizePayload(input = {}) {
  const task = clip(input.task, 40);
  if (!ALLOWED_TASKS.has(task)) throw Object.assign(new Error('Unsupported AI task.'), { statusCode: 400 });

  const locale = input.locale === 'ar' ? 'ar' : 'en';
  const payload = {
    task,
    locale,
    profile: cleanProfile(input.profile),
    currentText: clip(input.currentText),
    instruction: clip(input.instruction, 500),
    existingSkills: cleanList(input.existingSkills, 24, 100),
    experience: (Array.isArray(input.experience) ? input.experience : []).slice(0, 8).map(item => ({
      role: clip(item?.role, 140),
      bullets: cleanList(item?.bullets, 8, 420)
    }))
  };

  // Explicitly ignore names, email addresses, phone numbers, locations, links and raw CV objects.
  return payload;
}

function commonRules(locale) {
  const language = locale === 'ar' ? 'Arabic' : 'English';
  return [
    'You are a professional CV writing assistant.',
    `Write in ${language}.`,
    'Never invent employers, dates, degrees, certifications, awards, languages, metrics, tools, seniority, or responsibilities.',
    'Use only the facts provided in this task payload.',
    'If a fact is missing, keep the wording general or preserve a [X] placeholder instead of making it up.',
    'Do not include names, emails, phone numbers, addresses, or links.',
    'Return only the requested content. Do not add commentary or markdown headings.'
  ].join('\n');
}

function buildPrompt(rawInput) {
  const input = sanitizePayload(rawInput);
  const context = JSON.stringify({ profile: input.profile, existingSkills: input.existingSkills }, null, 2);
  const rules = commonRules(input.locale);

  if (input.task === 'summary') {
    return {
      prompt: `${rules}\n\nTask: Write a concise professional CV summary in 2-3 sentences. Match the exact profession, specialization, and career level. Do not claim facts that are not provided.\n\nCareer context:\n${context}`,
      temperature: 0.35,
      maxOutputTokens: 350
    };
  }

  if (input.task === 'improve_text') {
    if (!input.currentText) throw Object.assign(new Error('Missing text to improve.'), { statusCode: 400 });
    return {
      prompt: `${rules}\n\nTask: ${input.instruction || 'Improve this CV text for clarity, specificity, and professional tone.'}\nKeep every factual claim unchanged. Do not add new facts.\n\nCareer context:\n${context}\n\nCurrent text:\n${input.currentText}`,
      temperature: 0.25,
      maxOutputTokens: 600
    };
  }

  if (input.task === 'translate') {
    if (!input.currentText) throw Object.assign(new Error('Missing text to translate.'), { statusCode: 400 });
    const target = input.locale === 'ar' ? 'Arabic' : 'English';
    return {
      prompt: `${rules}\n\nTask: Translate the following CV text into ${target}. Preserve all facts and meaning. Do not improve by adding information.\n\nText:\n${input.currentText}`,
      temperature: 0.1,
      maxOutputTokens: 700
    };
  }

  if (input.task === 'improve_bullets') {
    if (!input.experience.length) throw Object.assign(new Error('Missing experience bullets.'), { statusCode: 400 });
    return {
      prompt: `${rules}\n\nTask: Rewrite the supplied experience bullets to be concise and action-oriented. Keep the same roles and the same number of bullets for each role. Do not add metrics or tools. Return valid JSON only in this exact shape: [{"role":"...","bullets":["..."]}]\n\nCareer context:\n${context}\n\nExperience:\n${JSON.stringify(input.experience, null, 2)}`,
      temperature: 0.15,
      maxOutputTokens: 1000
    };
  }

  return {
    prompt: `${rules}\n\nTask: Suggest up to 10 skills that are commonly relevant to this exact profession and level, but present them only as possibilities for the user to verify. Exclude existing skills. Return valid JSON only in this exact shape: ["Skill 1","Skill 2"].\n\nCareer context:\n${context}`,
    temperature: 0.2,
    maxOutputTokens: 350
  };
}

module.exports = { ALLOWED_TASKS, sanitizePayload, buildPrompt };
