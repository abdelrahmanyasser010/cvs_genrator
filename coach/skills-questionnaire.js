/**
 * Skills questionnaire — builds skills from yes/no answers
 */
const SkillsQuestionnaire = (function () {
  async function loadForCareer(career) {
    return ContentPicker.getSkillsQuestionnaire(career);
  }

  async function loadForSpecialization(specOrCareer) {
    if (typeof specOrCareer === 'object' && specOrCareer.careerProfile) {
      return loadForCareer(specOrCareer);
    }
    return ContentPicker.getSkillsQuestionnaire('en', specOrCareer === 'flutter' || specOrCareer === 'android' ? 'developer' : (specOrCareer || 'developer'));
  }

  function buildSkillsFromAnswers(questionnaire, answers, existingSkills) {
    const skills = new Set(existingSkills || questionnaire.coreSkills || []);

    (questionnaire.questions || []).forEach(q => {
      if (answers[q.id] === true) {
        (q.skills || []).forEach(s => skills.add(s));
      }
    });

    return Array.from(skills);
  }

  function skillsToCategories(flatSkills, career) {
    const s = flatSkills || [];
    const field = career?.careerProfile?.field || 'developer';
    const spec = career?.careerProfile?.specialization || '';

    if (field === 'developer' || spec === 'flutter' || spec === 'android') {
      const cats = {
        'Languages': ['Dart'].filter(() => s.some(x => /dart/i.test(x)) || spec === 'flutter'),
        'Framework': [],
        'State Management': s.filter(x => /bloc|provider|getx|mobx|cubit/i.test(x)),
        'Backend Integration': s.filter(x => /firebase|rest|api|socket|supabase|websocket|dio/i.test(x)),
        'Local Storage': s.filter(x => /sqlite|hive|drift|shared|storage|offline/i.test(x)),
        'Maps & Location': s.filter(x => /map|geoloc|location|mapbox/i.test(x)),
        'Tools': s.filter(x => /git|github|console/i.test(x))
      };
      if (s.some(x => /flutter/i.test(x)) || spec === 'flutter') {
        cats['Framework'] = ['Flutter (Android, iOS, Windows)'];
      }
      if (!cats['Languages'].length && spec === 'flutter') cats['Languages'] = ['Dart'];
      const used = new Set(Object.values(cats).flat());
      const other = s.filter(x => !used.has(x) && x !== 'Dart');
      if (other.length) cats['Other'] = other;
      return cats;
    }

    if (field === 'teacher' || field === 'accountant') {
      return { 'Skills': s };
    }
    return { 'Skills': s };
  }

  function mergeIntoCareer(career, flatSkills) {
    const cats = skillsToCategories(flatSkills, career);
    career.skills = {};
    Object.entries(cats).forEach(([k, vals]) => {
      if (vals && vals.length) career.skills[k] = [...new Set(vals)];
    });
    return career;
  }

  return { loadForCareer, loadForSpecialization, buildSkillsFromAnswers, skillsToCategories, mergeIntoCareer };
})();

if (typeof module !== 'undefined') module.exports = SkillsQuestionnaire;
