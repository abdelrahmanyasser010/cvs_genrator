/**
 * Prompt System — Translation
 * 
 * Generates contextual prompts for translating CV content between languages
 */

const TranslatePrompts = (function () {
  const templates = {
    en_to_ar: {
      professional: "You are a professional translator. Translate this CV content from English to Arabic. Maintain professional tone and CV formatting standards. Use appropriate Arabic business terminology.\n\nContent: \"{content}\"",
      casual: "You are a professional translator. Translate this content from English to Arabic. Maintain the meaning while making it natural in Arabic.\n\nContent: \"{content}\""
    },
    ar_to_en: {
      professional: "You are a professional translator. Translate this CV content from Arabic to English. Maintain professional tone and CV formatting standards. Use appropriate English business terminology.\n\nContent: \"{content}\"",
      casual: "You are a professional translator. Translate this content from Arabic to English. Maintain the meaning while making it natural in English.\n\nContent: \"{content}\""
    }
  };

  function getPrompt(fromLang, toLang, content, tone = 'professional') {
    const key = `${fromLang}_to_${toLang}`;
    const template = templates[key]?.[tone] || templates[key]?.professional;
    
    if (!template) {
      throw new Error(`Translation from ${fromLang} to ${toLang} not supported`);
    }
    
    return template.replace('{content}', content);
  }

  function previewPrompt(fromLang, toLang, content, tone = 'professional') {
    return getPrompt(fromLang, toLang, content, tone);
  }

  return {
    getPrompt,
    previewPrompt
  };
})();

if (typeof module !== 'undefined') module.exports = TranslatePrompts;
