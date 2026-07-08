/**
 * Pick content from locale/profession Knowledge Base
 */
const ContentPicker = (function () {
  const cache = {};

  function getLocale(careerOrLocale) {
    if (typeof careerOrLocale === 'string') return careerOrLocale;
    return careerOrLocale?.meta?.locale || (typeof I18n !== 'undefined' ? I18n.getLocale() : 'en') || 'en';
  }

  function getProfession(career) {
    return career?.careerProfile?.field || career?.careerProfile?.profession || 'other';
  }

  async function fetchJson(path) {
    if (cache[path]) return cache[path];
    const res = await fetch(path);
    if (!res.ok) throw new Error(path);
    const data = await res.json();
    cache[path] = data;
    return data;
  }

  function pickRandom(arr, excludeId) {
    if (!arr?.length) return null;
    const filtered = excludeId ? arr.filter(x => x.id !== excludeId) : arr;
    const pool = filtered.length ? filtered : arr;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  async function getSummary(careerOrLocale, professionOrLevel, levelOrExclude, excludeId) {
    let locale, profession, level, exclude;
    if (typeof careerOrLocale === 'object' && careerOrLocale.personalInfo) {
      locale = getLocale(careerOrLocale);
      profession = getProfession(careerOrLocale);
      level = careerOrLocale.careerProfile?.level || 'mid';
      exclude = professionOrLevel;
    } else {
      locale = careerOrLocale || 'en';
      profession = professionOrLevel || 'developer';
      level = levelOrExclude || 'mid';
      exclude = excludeId;
    }
    const paths = [
      `/knowledge-base/${locale}/${profession}/professional_summaries.json`,
      `/knowledge-base/en/${profession}/professional_summaries.json`,
      `/knowledge-base/content/${profession}/professional_summaries.json`
    ];
    if (profession === 'developer' || profession === 'flutter') {
      paths.push('/knowledge-base/content/flutter/professional_summaries.json');
    }
    for (const path of paths) {
      try {
        const data = await fetchJson(path);
        const pool = data.summaries.filter(s => !s.levels || s.levels.includes(level));
        const item = pickRandom(pool.length ? pool : data.summaries, exclude);
        return item ? { id: item.id, text: item.text } : { id: '', text: '' };
      } catch { /* try next */ }
    }
    return { id: '', text: '' };
  }

  async function getSkillsQuestionnaire(careerOrLocale, profession) {
    const locale = typeof careerOrLocale === 'object' ? getLocale(careerOrLocale) : (careerOrLocale || 'en');
    const prof = profession || (typeof careerOrLocale === 'object' ? getProfession(careerOrLocale) : 'developer');
    const paths = [
      `/knowledge-base/skills/${locale}/${prof}.json`,
      `/knowledge-base/skills/en/${prof}.json`,
      `/knowledge-base/skills/en/developer.json`
    ];
    for (const path of paths) {
      try { return await fetchJson(path); } catch { /* next */ }
    }
    return { coreSkills: [], questions: [] };
  }

  async function getProfile(careerOrLocale, profession) {
    const locale = typeof careerOrLocale === 'object' ? getLocale(careerOrLocale) : (careerOrLocale || 'en');
    const prof = profession || (typeof careerOrLocale === 'object' ? getProfession(careerOrLocale) : 'developer');
    const paths = [
      `/knowledge-base/${locale}/${prof}/profile.json`,
      `/knowledge-base/en/${prof}/profile.json`
    ];
    for (const path of paths) {
      try { 
        const profile = await fetchJson(path);
        // Backward compatibility: if old structure exists, convert to new
        if (profile && profile.recommendedLayouts && !profile.recommendedTemplates) {
          profile.recommendedTemplates = profile.recommendedLayouts;
        }
        return profile;
      } catch { /* next */ }
    }
    return null;
  }

  async function getKnowledge(careerOrLocale, profession) {
    const locale = typeof careerOrLocale === 'object' ? getLocale(careerOrLocale) : (careerOrLocale || 'en');
    const prof = profession || (typeof careerOrLocale === 'object' ? getProfession(careerOrLocale) : 'developer');
    const paths = [
      `/knowledge-base/${locale}/${prof}/knowledge.json`,
      `/knowledge-base/en/${prof}/knowledge.json`
    ];
    for (const path of paths) {
      try { return await fetchJson(path); } catch { /* next */ }
    }
    return null;
  }

  return { getSummary, getSkillsQuestionnaire, getProfile, getKnowledge, getLocale, getProfession, fetchJson };
})();

if (typeof module !== 'undefined') module.exports = ContentPicker;
