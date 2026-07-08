/**
 * Rule-based content improver (MVP — no LLM)
 */
const ContentImprover = (function () {
  const WEAK_PATTERNS = [
    { re: /^i made (?:an? )?(.+)\.?$/i, template: 'Developed $1 using modern development practices and clean architecture principles.' },
    { re: /^worked in (.+)\.?$/i, template: 'Worked at $1, contributing to team deliverables and cross-functional collaboration.' },
    { re: /^made app\.?$/i, template: 'Developed a cross-platform mobile application with REST API integration and structured state management.' },
    { re: /^built app\.?$/i, template: 'Built and deployed a production mobile application with user authentication and backend integration.' }
  ];

  const VERB_SUGGESTIONS = ['Developed', 'Built', 'Implemented', 'Integrated', 'Designed', 'Optimized', 'Refactored', 'Delivered'];

  function isWeak(text) {
    if (!text || text.trim().length < 15) return true;
    const t = text.trim();
    if (/^(i |worked|made|did|was)/i.test(t) && t.length < 80) return true;
    if (!VERB_SUGGESTIONS.some(v => t.startsWith(v))) return t.length < 40;
    return false;
  }

  function improve(text, context) {
    if (!text) return { improved: '', suggestions: VERB_SUGGESTIONS.slice(0, 4) };
    const t = text.trim();

    for (const p of WEAK_PATTERNS) {
      const m = t.match(p.re);
      if (m) {
        const improved = p.template.replace(/\$(\d+)/g, (_, n) => m[parseInt(n, 10)] || '');
        return { improved, suggestions: VERB_SUGGESTIONS, wasWeak: true };
      }
    }

    if (isWeak(t)) {
      const topic = context?.topic || 'application features';
      return {
        improved: `Developed ${topic} using industry best practices, ensuring maintainable code and reliable delivery.`,
        suggestions: VERB_SUGGESTIONS,
        wasWeak: true
      };
    }

    if (!VERB_SUGGESTIONS.some(v => t.startsWith(v))) {
      return {
        improved: `${VERB_SUGGESTIONS[0]} ${t.charAt(0).toLowerCase()}${t.slice(1)}`,
        suggestions: VERB_SUGGESTIONS,
        wasWeak: false
      };
    }

    return { improved: t, suggestions: [], wasWeak: false };
  }

  function toBullets(text, max) {
    const sentences = text.split(/[.!?]+/).map(s => s.trim()).filter(s => s.length > 10);
    const limit = max || 4;
    return sentences.slice(0, limit).map(s => {
      const imp = improve(s);
      return imp.improved;
    });
  }

  return { isWeak, improve, toBullets, VERB_SUGGESTIONS };
})();

if (typeof module !== 'undefined') module.exports = ContentImprover;
