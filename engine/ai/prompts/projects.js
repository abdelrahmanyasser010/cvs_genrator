/**
 * Prompt System — Project Description Generator
 * 
 * Generates contextual prompts for writing project descriptions based on:
 * - Profession (developer, teacher, accountant, etc.)
 * - Language (en, ar)
 * - Project type (web, mobile, research, etc.)
 */

const ProjectPrompts = (function () {
  const templates = {
    en: {
      developer: {
        generate: "You are a professional CV writer. Write a compelling project description for a {profession}. The project is about: {description}. Focus on: technical implementation, challenges solved, and impact. Keep it 2-3 sentences.",
        improve: "You are a professional CV writer. Improve this project description for a {profession}. Add technical details, specific technologies used, and measurable outcomes. Keep it 2-3 sentences.\n\nOriginal: \"{original}\"",
        bullets: "You are a professional CV writer. Convert this project description into 3-4 impactful bullet points for a {profession} CV. Focus on: technical achievements, problem-solving, and results.\n\nDescription: \"{description}\""
      },
      teacher: {
        generate: "You are a professional CV writer. Write a compelling project description for a {profession}. The project is about: {description}. Focus on: educational objectives, teaching methods, and student outcomes. Keep it 2-3 sentences.",
        improve: "You are a professional CV writer. Improve this project description for a {profession}. Add specific learning outcomes, methodologies used, and student achievements. Keep it 2-3 sentences.\n\nOriginal: \"{original}\"",
        bullets: "You are a professional CV writer. Convert this project description into 3-4 impactful bullet points for a {profession} CV. Focus on: educational impact, innovation, and student engagement.\n\nDescription: \"{description}\""
      },
      accountant: {
        generate: "You are a professional CV writer. Write a compelling project description for a {profession}. The project is about: {description}. Focus on: financial objectives, processes improved, and compliance. Keep it 2-3 sentences.",
        improve: "You are a professional CV writer. Improve this project description for a {profession}. Add specific financial metrics, compliance standards, and process improvements. Keep it 2-3 sentences.\n\nOriginal: \"{original}\"",
        bullets: "You are a professional CV writer. Convert this project description into 3-4 impactful bullet points for a {profession} CV. Focus on: financial accuracy, efficiency gains, and compliance.\n\nDescription: \"{description}\""
      },
      other: {
        generate: "You are a professional CV writer. Write a compelling project description for a {profession}. The project is about: {description}. Focus on: objectives, methods, and impact. Keep it 2-3 sentences.",
        improve: "You are a professional CV writer. Improve this project description for a {profession}. Add specific details, methodologies, and measurable outcomes. Keep it 2-3 sentences.\n\nOriginal: \"{original}\"",
        bullets: "You are a professional CV writer. Convert this project description into 3-4 impactful bullet points for a {profession} CV. Focus on: achievements, problem-solving, and results.\n\nDescription: \"{description}\""
      }
    },
    ar: {
      developer: {
        generate: "أنت محترف في كتابة السير الذاتية. اكتب وصف مشروع مقنع لـ {profession}. المشروع عن: {description}. ركز على: التنفيذ التقني، التحديات التي تم حلها، والتأثير. اجعله 2-3 جمل.",
        improve: "أنت محترف في كتابة السير الذاتية. حسّن وصف هذا المشروع لـ {profession}. أضف تفاصيل تقنية، تقنيات محددة مستخدمة، ونتائج قابلة للقياس. اجعله 2-3 جمل.\n\nالأصل: \"{original}\"",
        bullets: "أنت محترف في كتابة السير الذاتية. حول وصف هذا المشروع إلى 3-4 نقاط مؤثرة لسيرة ذاتية لـ {profession}. ركز على: الإنجازات التقنية، حل المشكلات، والنتائج.\n\nالوصف: \"{description}\""
      },
      teacher: {
        generate: "أنت محترف في كتابة السير الذاتية. اكتب وصف مشروع مقنع لـ {profession}. المشروع عن: {description}. ركز على: الأهداف التعليمية، طرق التدريس، ونتائج الطلاب. اجعله 2-3 جمل.",
        improve: "أنت محترف في كتابة السير الذاتية. حسّن وصف هذا المشروع لـ {profession}. أضف نتائج تعلم محددة، منهجيات مستخدمة، وإنجازات الطلاب. اجعله 2-3 جمل.\n\nالأصل: \"{original}\"",
        bullets: "أنت محترف في كتابة السير الذاتية. حول وصف هذا المشروع إلى 3-4 نقاط مؤثرة لسيرة ذاتية لـ {profession}. ركز على: التأثير التعليمي، الابتكار، ومشاركة الطلاب.\n\nالوصف: \"{description}\""
      },
      accountant: {
        generate: "أنت محترف في كتابة السير الذاتية. اكتب وصف مشروع مقنع لـ {profession}. المشروع عن: {description}. ركز على: الأهداف المالية، تحسينات العمليات، والامتثال. اجعله 2-3 جمل.",
        improve: "أنت محترف في كتابة السير الذاتية. حسّن وصف هذا المشروع لـ {profession}. أضف مقاييس مالية محددة، معايير الامتثال، وتحسينات العمليات. اجعله 2-3 جمل.\n\nالأصل: \"{original}\"",
        bullets: "أنت محترف في كتابة السير الذاتية. حول وصف هذا المشروع إلى 3-4 نقاط مؤثرة لسيرة ذاتية لـ {profession}. ركز على: الدقة المالية، مكاسب الكفاءة، والامتثال.\n\nالوصف: \"{description}\""
      },
      other: {
        generate: "أنت محترف في كتابة السير الذاتية. اكتب وصف مشروع مقنع لـ {profession}. المشروع عن: {description}. ركز على: الأهداف، الطرق، والتأثير. اجعله 2-3 جمل.",
        improve: "أنت محترف في كتابة السير الذاتية. حسّن وصف هذا المشروع لـ {profession}. أضف تفاصيل محددة، منهجيات، ونتائج قابلة للقياس. اجعله 2-3 جمل.\n\nالأصل: \"{original}\"",
        bullets: "أنت محترف في كتابة السير الذاتية. حول وصف هذا المشروع إلى 3-4 نقاط مؤثرة لسيرة ذاتية لـ {profession}. ركز على: الإنجازات، حل المشكلات، والنتائج.\n\nالوصف: \"{description}\""
      }
    }
  };

  function getPrompt(profession, language, action, context = {}) {
    const lang = language || 'en';
    const prof = profession || 'other';
    
    const template = templates[lang]?.[prof]?.[action] || templates[lang]?.['other']?.[action] || templates['en']['other']['generate'];
    
    let prompt = template.replace('{profession}', prof);
    
    if (action === 'generate' && context.description) {
      prompt = prompt.replace('{description}', context.description);
    }
    
    if (action === 'improve' && context.original) {
      prompt = prompt.replace('{original}', context.original);
    }
    
    if (action === 'bullets' && context.description) {
      prompt = prompt.replace('{description}', context.description);
    }
    
    if (context.technologies && context.technologies.length > 0) {
      prompt += `\n\nTechnologies used: ${context.technologies.join(', ')}.`;
    }
    
    return prompt;
  }

  function previewPrompt(profession, language, action, context = {}) {
    return getPrompt(profession, language, action, context);
  }

  return {
    getPrompt,
    previewPrompt
  };
})();

if (typeof module !== 'undefined') module.exports = ProjectPrompts;
