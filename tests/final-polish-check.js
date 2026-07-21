const assert = require('assert');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const read = rel => fs.readFileSync(path.join(ROOT, rel), 'utf8');

global.CareerNormalize = require(path.join(ROOT, 'engine/normalize-career.js'));
const TemplateSelector = require(path.join(ROOT, 'engine/template-selector.js'));
const CVSections = require(path.join(ROOT, 'engine/cv-sections.js'));
const AICoach = require(path.join(ROOT, 'coach/ai-coach.js'));

// Curated template catalog: a focused professional set, with legacy templates hidden.
const featured = TemplateSelector.getFeaturedTemplates().map(item => item.id);
assert.deepEqual(featured, ['ats', 'classic', 'modern', 'corporate', 'executive']);
for (const id of featured) {
  assert(fs.existsSync(path.join(ROOT, `templates/${id}/style.css`)), `Missing professional template CSS: ${id}`);
}

// Wizard must collect meaningful facts rather than one-line placeholders.
const wizard = read('app/assets/wizard.js');
assert(!/nice_to_meet/.test(wizard), 'Duplicated greeting step must not return');
assert(/'profile',\s*'summary',\s*'education',\s*'experience'/.test(wizard), 'Core wizard flow is incomplete');
for (const id of ['wz-input-exp-role', 'wz-input-exp-company', 'wz-input-exp-period', 'wz-input-exp-desc']) {
  assert(wizard.includes(id), `Experience wizard field missing: ${id}`);
}
for (const id of ['wz-input-proj-role', 'wz-input-proj-tech', 'wz-input-proj-desc']) {
  assert(wizard.includes(id), `Project wizard field missing: ${id}`);
}
assert.equal((wizard.match(/case 'projects'/g) || []).length, 2, 'Projects should have one collection case and one render case');
const nextBlock = wizard.slice(wizard.indexOf('async function handleNext()'), wizard.indexOf('function handlePrev()'));
assert(!nextBlock.includes('<h1 class="wz-title">'), 'Wizard rendering HTML leaked into data collection');
assert(wizard.includes("if (isTextarea && !(event.ctrlKey || event.metaKey)) return;"), 'Textarea Enter must create a new line');
assert(wizard.includes("projectMode || 'hidden'"), 'Projects must be role-aware');

// AI interactions must preserve trust and show a review step.
const editor = read('app/assets/editor.js');
assert(editor.includes('showSmartFixPreviewModal'), 'Before/after AI review is missing');
assert(editor.includes('draft.professionalSummary = text.trim()'), 'Generated summaries must use the review workflow');
assert(editor.includes("extractSectionTextForCompare(career, 'weak-experience')"), 'Experience comparison is missing');
assert(!/نبذة زي الناس|حطها في السيرة|لأ، سيب القديم/.test(editor), 'Unprofessional microcopy remains');
assert(!/application\/msword/.test(editor), 'Fake Word export fallback must not ship');

// Offline coach must not invent experience when the user supplied none.
const blank = CareerNormalize.createEmpty();
blank.meta.locale = 'ar';
blank.careerProfile = { field: 'accountant', level: 'fresh', years: '0' };
blank.personalInfo.title = 'محاسب حديث التخرج';
blank.experience = [{ role: 'متدرب حسابات', company: 'شركة حقيقية', period: '2025', bullets: [], rawDescription: '' }];
AICoach.improveExperienceBullets(blank);
assert.deepEqual(blank.experience[0].bullets, [], 'Coach invented experience bullets');

blank.skills = { core: ['Excel', 'التسويات البنكية'] };
const summary = AICoach.buildFallbackSummary(blank);
assert(summary.includes('محاسب حديث التخرج'));
assert(summary.includes('Excel'));
assert(!/شركة رائدة|جامعة معتمدة|15%|20%/.test(summary), 'Fallback summary contains invented facts');

// Custom sections must survive normalization and render in the CV.
const withCustom = CareerNormalize.normalize({
  personalInfo: { name: 'Test User' },
  customSections: [{ id: 'custom-1', title: 'عضويات مهنية', type: 'tags', content: 'جمعية مهنية\nمجتمع متخصص', visible: true }]
});
assert.equal(withCustom.customSections.length, 1);
const customHtml = CVSections.customSections(withCustom);
assert(customHtml.includes('عضويات مهنية'));
assert(customHtml.includes('cv-custom-tags'));

// CSS should contain only one Smart Fix component definition and final responsive safeguards.
const css = read('app/assets/final-polish.css');
assert.equal((css.match(/\.smartfix-modal\s*\{/g) || []).length, 1, 'Duplicated Smart Fix CSS blocks remain');
assert(css.includes('.professional-ai-action'));
assert(css.includes('.template-gallery-grid'));
assert(css.includes('.ai-request-preview-box'), 'Professional AI request preview styles are missing');
assert(css.includes('.ats-honest-score'), 'Honest ATS score styles are missing');
assert(css.includes('.panel-scroll-content') || css.includes('padding-bottom'), 'Scrollable panel safeguards are missing');

// No backup artifacts should be referenced by production HTML.
const editorHtml = read('app/editor.html');
assert(editorHtml.includes('final-polish.css'));
assert(!/\.bak2|\.pre_final/.test(editorHtml));

console.log('Final professional polish checks passed.');
