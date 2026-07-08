/**
 * Prompt System — Skills Suggestion
 * 
 * Generates contextual prompts for suggesting skills based on:
 * - Profession (developer, teacher, accountant, etc.)
 * - Language (en, ar)
 * - Specialization (flutter, android, frontend, etc.)
 */

const SkillsPrompts = (function () {
  const templates = {
    en: {
      developer: {
        suggest: "You are a career expert. Suggest 5-7 relevant skills for a {profession} specializing in {specialization}. Focus on current industry standards and in-demand technologies. Return as a comma-separated list.",
        from_project: "You are a career expert. Based on this project description, suggest 5 relevant technical skills:\n\nProject: \"{project}\"\n\nReturn as a comma-separated list."
      },
      teacher: {
        suggest: "You are a career expert. Suggest 5-7 relevant skills for a {profession} specializing in {specialization}. Focus on pedagogical methods and educational tools. Return as a comma-separated list.",
        from_project: "You are a career expert. Based on this educational activity, suggest 5 relevant teaching skills:\n\nActivity: \"{project}\"\n\nReturn as a comma-separated list."
      },
      accountant: {
        suggest: "You are a career expert. Suggest 5-7 relevant skills for a {profession} specializing in {specialization}. Focus on financial standards and software. Return as a comma-separated list.",
        from_project: "You are a career expert. Based on this financial task, suggest 5 relevant accounting skills:\n\nTask: \"{project}\"\n\nReturn as a comma-separated list."
      },
      other: {
        suggest: "You are a career expert. Suggest 5-7 relevant skills for a {profession} specializing in {specialization}. Focus on industry standards. Return as a comma-separated list.",
        from_project: "You are a career expert. Based on this work, suggest 5 relevant skills:\n\nWork: \"{project}\"\n\nReturn as a comma-separated list."
      }
    },
    ar: {
      developer: {
        suggest: "أنت خبير مسارات مهنية. اقترح 5-7 مهارات ذات صلة لـ {profession} متخصص في {specialization}. ركز على معايير الصناعة الحالية والتقنيات المطلوبة. أعد كقائمة مفصولة بفواصل.",
        from_project: "أنت خبير مسارات مهنية. بناءً على وصف هذا المشروع، اقترح 5 مهارات تقنية ذات صلة:\n\nالمشروع: \"{project}\"\n\nأعد كقائمة مفصولة بفواصل."
      },
      teacher: {
        suggest: "أنت خبير مسارات مهنية. اقترح 5-7 مهارات ذات صلة لـ {profession} متخصص في {specialization}. ركز على طرق التدريس والأدوات التعليمية. أعد كقائمة مفصولة بفواصل.",
        from_project: "أنت خبير مسارات مهنية. بناءً على هذا النشاط التعليمي، اقترح 5 مهارات تدريس ذات صلة:\n\nالنشاط: \"{project}\"\n\nأعد كقائمة مفصولة بفواصل."
      },
      accountant: {
        suggest: "أنت خبير مسارات مهنية. اقترح 5-7 مهارات ذات صلة لـ {profession} متخصص في {specialization}. ركز على المعايير المالية والبرامج. أعد كقائمة مفصولة بفواصل.",
        from_project: "أنت خبير مسارات مهنية. بناءً على هذه المهمة المالية، اقترح 5 مهارات محاسبة ذات صلة:\n\nالمهمة: \"{project}\"\n\nأعد كقائمة مفصولة بفواصل."
      },
      other: {
        suggest: "أنت خبير مسارات مهنية. اقترح 5-7 مهارات ذات صلة لـ {profession} متخصص في {specialization}. ركز على معايير الصناعة. أعد كقائمة مفصولة بفواصل.",
        from_project: "أنت خبير مسارات مهنية. بناءً على هذا العمل، اقترح 5 مهارات ذات صلة:\n\nالعمل: \"{project}\"\n\nأعد كقائمة مفصولة بفواصل."
      }
    }
  };

  function getPrompt(profession, language, specialization, action, context = {}) {
    const lang = language || 'en';
    const prof = profession || 'other';
    const spec = specialization || 'general';
    
    const template = templates[lang]?.[prof]?.[action] || templates[lang]?.['other']?.[action] || templates['en']['other']['suggest'];
    
    let prompt = template
      .replace('{profession}', prof)
      .replace('{specialization}', spec);
    
    if (action === 'from_project' && context.project) {
      prompt = prompt.replace('{project}', context.project);
    }
    
    if (context.currentSkills && context.currentSkills.length > 0) {
      prompt += `\n\nCurrent skills (avoid duplicates): ${context.currentSkills.join(', ')}.`;
    }
    
    return prompt;
  }

  function previewPrompt(profession, language, specialization, action, context = {}) {
    return getPrompt(profession, language, specialization, action, context);
  }

  return {
    getPrompt,
    previewPrompt
  };
})();

if (typeof module !== 'undefined') module.exports = SkillsPrompts;
