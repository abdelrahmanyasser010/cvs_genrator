/**
 * Prompt System — Tailor CV to Job Description
 * 
 * Generates contextual prompts for tailoring a CV to match a specific job description
 */

const TailorPrompts = (function () {
  const templates = {
    en: {
      analyze: "You are a career expert. Analyze this job description and identify the top 5-7 key skills and requirements:\n\n{jobDescription}\n\nReturn as a comma-separated list.",
      summary: "You are a professional CV writer. Tailor this professional summary to match the job description. Highlight relevant skills and experience. Keep it 2-3 sentences.\n\nCurrent Summary: \"{currentSummary}\"\n\nJob Description: {jobDescription}",
      experience: "You are a professional CV writer. Tailor this experience bullet to match the job description. Emphasize relevant skills and achievements. Keep it under 25 words.\n\nCurrent Bullet: \"{currentBullet}\"\n\nJob Description: {jobDescription}",
      skills: "You are a career expert. Based on this job description, suggest which skills from the candidate's profile should be highlighted:\n\nJob Description: {jobDescription}\n\nCandidate Skills: {candidateSkills}\n\nReturn as a comma-separated list of skills to highlight."
    },
    ar: {
      analyze: "أنت خبير مسارات مهنية. حلل هذا الوصف الوظيفي وحدد أهم 5-7 مهارات ومتطلبات رئيسية:\n\n{jobDescription}\n\nأعد كقائمة مفصولة بفواصل.",
      summary: "أنت محترف في كتابة السير الذاتية. طابق هذا الملخص المهني مع الوصف الوظيفي. أبرز المهارات والخبرة ذات الصلة. اجعله 2-3 جمل.\n\nالملخص الحالي: \"{currentSummary}\"\n\nالوصف الوظيفي: {jobDescription}",
      experience: "أنت محترف في كتابة السير الذاتية. طابق هذه النقطة الخبرية مع الوصف الوظيفي. أكد على المهارات والإنجازات ذات الصلة. اجعلها أقل من 25 كلمة.\n\nالنقطة الحالية: \"{currentBullet}\"\n\nالوصف الوظيفي: {jobDescription}",
      skills: "أنت خبير مسارات مهنية. بناءً على هذا الوصف الوظيفي، اقترح المهارات من ملف المرشح التي يجب إبرازها:\n\nالوصف الوظيفي: {jobDescription}\n\nمهارات المرشح: {candidateSkills}\n\nأعد كقائمة مفصولة بفواصل للمهارات التي يجب إبرازها."
    }
  };

  function getPrompt(language, action, context = {}) {
    const lang = language || 'en';
    const template = templates[lang]?.[action];
    
    if (!template) {
      throw new Error(`Tailor action ${action} not supported for language ${lang}`);
    }
    
    let prompt = template;
    
    if (context.jobDescription) {
      prompt = prompt.replace('{jobDescription}', context.jobDescription);
    }
    
    if (context.currentSummary) {
      prompt = prompt.replace('{currentSummary}', context.currentSummary);
    }
    
    if (context.currentBullet) {
      prompt = prompt.replace('{currentBullet}', context.currentBullet);
    }
    
    if (context.candidateSkills) {
      prompt = prompt.replace('{candidateSkills}', context.candidateSkills);
    }
    
    return prompt;
  }

  function previewPrompt(language, action, context = {}) {
    return getPrompt(language, action, context);
  }

  return {
    getPrompt,
    previewPrompt
  };
})();

if (typeof module !== 'undefined') module.exports = TailorPrompts;
