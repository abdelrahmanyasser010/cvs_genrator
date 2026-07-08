/**
 * Prompt System — Professional Summary
 * 
 * Generates contextual prompts based on:
 * - Profession (developer, teacher, accountant, etc.)
 * - Language (en, ar)
 * - Experience level (fresh, junior, mid, senior)
 */

const SummaryPrompts = (function () {
  const templates = {
    en: {
      developer: {
        fresh: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: potential, learning attitude, relevant skills. Tone: enthusiastic and professional.",
        junior: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: practical skills, project experience, collaboration. Tone: confident and professional.",
        mid: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: expertise, leadership, impact. Tone: authoritative and professional.",
        senior: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: strategic vision, team leadership, industry impact. Tone: executive and professional."
      },
      teacher: {
        fresh: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: educational philosophy, student engagement, adaptability. Tone: passionate and professional.",
        junior: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: teaching methods, curriculum development, student outcomes. Tone: confident and professional.",
        mid: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: educational leadership, mentoring, curriculum innovation. Tone: authoritative and professional.",
        senior: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: educational strategy, department leadership, institutional impact. Tone: executive and professional."
      },
      accountant: {
        fresh: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: attention to detail, analytical skills, learning attitude. Tone: meticulous and professional.",
        junior: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: financial reporting, compliance, accuracy. Tone: confident and professional.",
        mid: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: financial analysis, process improvement, advisory. Tone: authoritative and professional.",
        senior: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: financial strategy, risk management, business leadership. Tone: executive and professional."
      },
      other: {
        fresh: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: potential, learning attitude, relevant skills. Tone: enthusiastic and professional.",
        junior: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: practical skills, collaboration, growth. Tone: confident and professional.",
        mid: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: expertise, impact, leadership. Tone: authoritative and professional.",
        senior: "You are a professional CV writer. Write a professional summary for a {profession} with {experience} experience. Keep it 2-3 sentences. Focus on: strategic vision, industry leadership. Tone: executive and professional."
      }
    },
    ar: {
      developer: {
        fresh: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: الإمكانيات، attitude التعلم، المهارات ذات الصلة. النبرة: متحمسة واحترافية.",
        junior: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: المهارات العملية، خبرة المشاريع، التعاون. النبرة: واثقة واحترافية.",
        mid: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: الخبرة، القيادة، التأثير. النبرة: سلطوية واحترافية.",
        senior: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: الرؤية الاستراتيجية، قيادة الفريق، التأثير الصناعي. النبرة: تنفيذية واحترافية."
      },
      teacher: {
        fresh: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: الفلسفة التعليمية، مشاركة الطلاب، التكيف. النبرة: شغوفة واحترافية.",
        junior: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: طرق التدريس، تطوير المناهج، نتائج الطلاب. النبرة: واثقة واحترافية.",
        mid: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: القيادة التعليمية، التوجيه، ابتكار المناهج. النبرة: سلطوية واحترافية.",
        senior: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: الاستراتيجية التعليمية، قيادة القسم، التأثير المؤسسي. النبرة: تنفيذية واحترافية."
      },
      accountant: {
        fresh: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: الاهتمام بالتفاصيل، المهارات التحليلية، attitude التعلم. النبرة: دقيقة واحترافية.",
        junior: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: التقارير المالية، الامتثال، الدقة. النبرة: واثقة واحترافية.",
        mid: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: التحليل المالي، تحسين العمليات، الاستشارة. النبرة: سلطوية واحترافية.",
        senior: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: الاستراتيجية المالية، إدارة المخاطر، القيادة التجارية. النبرة: تنفيذية واحترافية."
      },
      other: {
        fresh: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: الإمكانيات، attitude التعلم، المهارات ذات الصلة. النبرة: متحمسة واحترافية.",
        junior: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: المهارات العملية، التعاون، النمو. النبرة: واثقة واحترافية.",
        mid: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: الخبرة، التأثير، القيادة. النبرة: سلطوية واحترافية.",
        senior: "أ你 محترف في كتابة السير الذاتية. اكتب ملخصاً مهنياً لـ {profession} بخبرة {experience}. اجعله 2-3 جمل. ركز على: الرؤية الاستراتيجية، القيادة الصناعية. النبرة: تنفيذية واحترافية."
      }
    }
  };

  function getPrompt(profession, language, level, context = {}) {
    const lang = language || 'en';
    const prof = profession || 'other';
    const lvl = level || 'junior';
    
    const template = templates[lang]?.[prof]?.[lvl] || templates[lang]?.['other']?.[lvl] || templates['en']['other']['junior'];
    
    // Replace placeholders
    let prompt = template
      .replace('{profession}', prof)
      .replace('{experience}', context.experience || 'some');
    
    // Add context-specific information
    if (context.skills && context.skills.length > 0) {
      prompt += `\n\nKey skills: ${context.skills.join(', ')}.`;
    }
    
    if (context.currentSummary) {
      prompt += `\n\nCurrent summary (for improvement): "${context.currentSummary}"`;
    }
    
    return prompt;
  }

  function previewPrompt(profession, language, level, context = {}) {
    return getPrompt(profession, language, level, context);
  }

  return {
    getPrompt,
    previewPrompt
  };
})();

if (typeof module !== 'undefined') module.exports = SummaryPrompts;
