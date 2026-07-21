const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
global.CareerNormalize = require(path.join(ROOT, 'engine/normalize-career.js'));

function makeStorage() {
  const store = new Map();
  return {
    getItem(key) { return store.has(key) ? store.get(key) : null; },
    setItem(key, value) { store.set(key, String(value)); },
    removeItem(key) { store.delete(key); },
    clear() { store.clear(); },
    dump() { return Object.fromEntries(store.entries()); }
  };
}

global.localStorage = makeStorage();
const CareerStorage = require(path.join(ROOT, 'engine/career-storage.js'));
const AICoach = require(path.join(ROOT, 'coach/ai-coach.js'));

function loadRules(locale, field) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, 'knowledge-base', locale, field, 'rules.json'), 'utf8'));
}

function sample(field, level = 'fresh') {
  return {
    personalInfo: {
      name: 'أحمد علي',
      title: field === 'accountant' ? 'محاسب مالي' : field === 'doctor' ? 'طبيب امتياز' : 'متخصص',
      email: 'ahmed@example.com',
      phone: '+201000000000',
      location: 'القاهرة، مصر',
      links: {}
    },
    careerProfile: { field, level, years: level === 'senior' ? '10+' : level === 'fresh' ? '0' : '1-2' },
    professionalSummary: 'نبذة مهنية واضحة توضح التخصص والخبرة والقيمة التي يمكن تقديمها لصاحب العمل بدون معلومات مختلقة.',
    experience: [], projects: [],
    education: [{ degree: 'بكالوريوس', school: 'جامعة القاهرة', year: '2024' }],
    skills: { core: ['Excel', 'التواصل', 'التنظيم', 'حل المشكلات'] },
    languages: [], certificates: [], awards: [],
    meta: { locale: 'ar', templateId: 'ats', rules: loadRules('ar', field) }
  };
}

// Role-aware coaching must be materially different by profession and level.
const accountantFresh = AICoach.getRoleAwareMentorAdvice(sample('accountant', 'fresh'));
assert.equal(accountantFresh.projectMode, 'hidden');
assert(!accountantFresh.nextSteps.join(' ').includes('مشروع عملي كامل'));
assert(accountantFresh.nextSteps.join(' ').includes('Excel'));

const developerFresh = AICoach.getRoleAwareMentorAdvice(sample('developer', 'fresh'));
assert.equal(developerFresh.projectMode, 'required');
assert(developerFresh.nextSteps.join(' ').includes('مشروع'));

const accountantSenior = AICoach.getRoleAwareMentorAdvice(sample('accountant', 'senior'));
assert(accountantSenior.nextSteps.join(' ').match(/ميزانيات|ERP|قيادة/));

const doctorFresh = AICoach.getRoleAwareMentorAdvice(sample('doctor', 'fresh'));
assert.equal(doctorFresh.projectMode, 'hidden');
assert(doctorFresh.nextSteps.join(' ').match(/الامتياز|الترخيص|السريرية/));

// Accountant rules must not create a fake "missing projects" blocker.
const accountantReview = AICoach.getPreExportReview(sample('accountant', 'fresh'));
assert(!accountantReview.items.some(item => item.id === 'missing-project'));
assert(accountantReview.items.some(item => item.id === 'fresh-practical-evidence'));

// Developer rules do require practical projects.
const developerReview = AICoach.getPreExportReview(sample('developer', 'fresh'));
assert(developerReview.items.some(item => item.id === 'missing-project'));

// ATS readiness and job matching are separate concepts.
const blank = CareerNormalize.createEmpty();
blank.meta.locale = 'ar';
blank.meta.templateId = 'ats';
assert(AICoach.getATSReadiness(blank).score < AICoach.getATSReadiness(sample('accountant', 'fresh')).score);
const withJD = sample('accountant', 'fresh');
withJD.meta.targetJD = 'وصف وظيفة كامل '.repeat(10);
withJD.meta.jdMatchScore = 37;
const insights = AICoach.buildCoachInsights(withJD);
assert.equal(insights.ats.mode, 'job_match');
assert.equal(insights.ats.score, 37);
assert.notEqual(insights.ats.readinessScore, insights.ats.score);

// All registered professions must have a rules file in both locales.
const registry = JSON.parse(fs.readFileSync(path.join(ROOT, 'knowledge-base/registry.json'), 'utf8'));
for (const profession of Object.values(registry.professions || {})) {
  for (const locale of ['ar', 'en']) {
    assert(fs.existsSync(path.join(ROOT, 'knowledge-base', locale, profession.id, 'rules.json')), `Missing ${locale} rules for ${profession.id}`);
  }
  const advice = AICoach.getRoleAwareMentorAdvice(sample(profession.id, 'fresh'));
  assert(advice.nextSteps.length >= 3, `Weak coach profile for ${profession.id}`);
}

// Version storage must preserve the master CV while switching and deleting copies.
localStorage.clear();
const master = CareerStorage.createBlankVersion('السيرة الرئيسية').career;
master.personalInfo.name = 'Master User';
master.personalInfo.title = 'Accountant';
master.careerProfile.field = 'accountant';
CareerStorage.save(master);
const duplicate = CareerStorage.duplicateCareer('نسخة لوظيفة محددة', 'Full job description '.repeat(8));
assert.notEqual(duplicate.id, 'default');
duplicate.career.personalInfo.title = 'Senior Accountant';
CareerStorage.save(duplicate.career);
const restoredMaster = CareerStorage.switchVersion('default');
assert.equal(restoredMaster.personalInfo.title, 'Accountant');
assert.equal(CareerStorage.listVersions().length, 2);
assert(CareerStorage.deleteVersion(duplicate.id));
assert.equal(CareerStorage.getActiveVersionId(), 'default');
assert.equal(CareerStorage.load().personalInfo.name, 'Master User');

console.log('Senior delivery checks passed.');
