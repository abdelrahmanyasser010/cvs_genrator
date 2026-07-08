/**
 * Prompt System — Experience Rewriter
 * 
 * Generates contextual prompts for rewriting experience bullets based on:
 * - Profession (developer, teacher, accountant, etc.)
 * - Language (en, ar)
 * - Experience level (fresh, junior, mid, senior)
 */

const ExperiencePrompts = (function () {
  const templates = {
    en: {
      developer: {
        rewrite: "You are a professional CV writer. Rewrite this experience bullet for a {profession} with {experience} experience. Make it action-oriented, quantifiable, and impactful. Keep it under 25 words.\n\nOriginal: \"{original}\"",
        improve: "You are a professional CV writer. Improve this experience bullet for a {profession}. Add specific metrics, strong action verbs, and technical details. Keep it under 30 words.\n\nOriginal: \"{original}\"",
        shorten: "You are a professional CV writer. Shorten this experience bullet while keeping the key impact. Keep it under 15 words.\n\nOriginal: \"{original}\""
      },
      teacher: {
        rewrite: "You are a professional CV writer. Rewrite this experience bullet for a {profession} with {experience} experience. Focus on student outcomes, teaching methods, and educational impact. Keep it under 25 words.\n\nOriginal: \"{original}\"",
        improve: "You are a professional CV writer. Improve this experience bullet for a {profession}. Add specific student achievements, teaching methodologies, and measurable outcomes. Keep it under 30 words.\n\nOriginal: \"{original}\"",
        shorten: "You are a professional CV writer. Shorten this experience bullet while keeping the educational impact. Keep it under 15 words.\n\nOriginal: \"{original}\""
      },
      accountant: {
        rewrite: "You are a professional CV writer. Rewrite this experience bullet for a {profession} with {experience} experience. Focus on accuracy, compliance, and financial impact. Keep it under 25 words.\n\nOriginal: \"{original}\"",
        improve: "You are a professional CV writer. Improve this experience bullet for a {profession}. Add specific financial metrics, compliance standards, and process improvements. Keep it under 30 words.\n\nOriginal: \"{original}\"",
        shorten: "You are a professional CV writer. Shorten this experience bullet while keeping the financial impact. Keep it under 15 words.\n\nOriginal: \"{original}\""
      },
      other: {
        rewrite: "You are a professional CV writer. Rewrite this experience bullet for a {profession} with {experience} experience. Make it action-oriented and impactful. Keep it under 25 words.\n\nOriginal: \"{original}\"",
        improve: "You are a professional CV writer. Improve this experience bullet for a {profession}. Add specific metrics and strong action verbs. Keep it under 30 words.\n\nOriginal: \"{original}\"",
        shorten: "You are a professional CV writer. Shorten this experience bullet while keeping the key impact. Keep it under 15 words.\n\nOriginal: \"{original}\""
      }
    },
    ar: {
      developer: {
        rewrite: "أنت محترف في كتابة السير الذاتية. أعد صياغة هذه النقطة لـ {profession} بخبرة {experience}. اجعلها موجهة للعمل، قابلة للقياس، ومؤثرة. اجعلها أقل من 25 كلمة.\n\nالأصل: \"{original}\"",
        improve: "أنت محترف في كتابة السير الذاتية. حسّن هذه النقطة لـ {profession}. أضف مقاييس محددة، أفعال قوية، وتفاصيل تقنية. اجعلها أقل من 30 كلمة.\n\nالأصل: \"{original}\"",
        shorten: "أنت محترف في كتابة السير الذاتية. اختصر هذه النقطة مع الحفاظ على التأثير الرئيسي. اجعلها أقل من 15 كلمة.\n\nالأصل: \"{original}\""
      },
      teacher: {
        rewrite: "أنت محترف في كتابة السير الذاتية. أعد صياغة هذه النقطة لـ {profession} بخبرة {experience}. ركز على نتائج الطلاب، طرق التدريس، والتأثير التعليمي. اجعلها أقل من 25 كلمة.\n\nالأصل: \"{original}\"",
        improve: "أنت محترف في كتابة السير الذاتية. حسّن هذه النقطة لـ {profession}. أضف إنجازات طلاب محددة، منهجيات تدريس، ونتائج قابلة للقياس. اجعلها أقل من 30 كلمة.\n\nالأصل: \"{original}\"",
        shorten: "أنت محترف في كتابة السير الذاتية. اختصر هذه النقطة مع الحفاظ على التأثير التعليمي. اجعلها أقل من 15 كلمة.\n\nالأصل: \"{original}\""
      },
      accountant: {
        rewrite: "أنت محترف في كتابة السير الذاتية. أعد صياغة هذه النقطة لـ {profession} بخبرة {experience}. ركز على الدقة، الامتثال، والتأثير المالي. اجعلها أقل من 25 كلمة.\n\nالأصل: \"{original}\"",
        improve: "أنت محترف في كتابة السير الذاتية. حسّن هذه النقطة لـ {profession}. أضف مقاييس مالية محددة، معايير الامتثال، وتحسينات العمليات. اجعلها أقل من 30 كلمة.\n\nالأصل: \"{original}\"",
        shorten: "أنت محترف في كتابة السير الذاتية. اختصر هذه النقطة مع الحفاظ على التأثير المالي. اجعلها أقل من 15 كلمة.\n\nالأصل: \"{original}\""
      },
      other: {
        rewrite: "أنت محترف في كتابة السير الذاتية. أعد صياغة هذه النقطة لـ {profession} بخبرة {experience}. اجعلها موجهة للعمل ومؤثرة. اجعلها أقل من 25 كلمة.\n\nالأصل: \"{original}\"",
        improve: "أنت محترف في كتابة السير الذاتية. حسّن هذه النقطة لـ {profession}. أضف مقاييس محددة وأفعال قوية. اجعلها أقل من 30 كلمة.\n\nالأصل: \"{original}\"",
        shorten: "أنت محترف في كتابة السير الذاتية. اختصر هذه النقطة مع الحفاظ على التأثير الرئيسي. اجعلها أقل من 15 كلمة.\n\nالأصل: \"{original}\""
      }
    }
  };

  function getPrompt(profession, language, level, action, original, context = {}) {
    const lang = language || 'en';
    const prof = profession || 'other';
    const lvl = level || 'junior';
    
    const template = templates[lang]?.[prof]?.[action] || templates[lang]?.['other']?.[action] || templates['en']['other']['rewrite'];
    
    let prompt = template
      .replace('{profession}', prof)
      .replace('{experience}', context.experience || 'some')
      .replace('{original}', original);
    
    if (context.skills && context.skills.length > 0) {
      prompt += `\n\nRelevant skills: ${context.skills.join(', ')}.`;
    }
    
    return prompt;
  }

  function previewPrompt(profession, language, level, action, original, context = {}) {
    return getPrompt(profession, language, level, action, original, context);
  }

  return {
    getPrompt,
    previewPrompt
  };
})();

if (typeof module !== 'undefined') module.exports = ExperiencePrompts;
