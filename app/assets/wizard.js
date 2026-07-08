/**
 * CV Studio — Premium Onboarding Wizard
 */
const Wizard = (function () {
  const STEPS = [
    'welcome', 'locale', 'name', 'nice_to_meet', 'field', 'experience_years', 'location', 
    'email', 'phone', 'linkedin', 'github', 'education', 'experience', 'projects', 'skills', 'template', 'done'
  ];
  const LINK_PROOF_FIELDS = ['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'marketing', 'data_analyst'];
  const GITHUB_FIELDS = ['developer', 'data_analyst'];
  const PROJECT_FIELDS = ['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'marketing', 'data_analyst'];

  let career = null;
  let stepIndex = 0;

  const el = id => document.getElementById(id);
  const t = (key, fb) => (typeof I18n !== 'undefined' ? I18n.t(key, fb) : fb || key);
  const h = value => (typeof Safety !== 'undefined' ? Safety.escapeHtml(value) : String(value || ''));
  const a = value => (typeof Safety !== 'undefined' ? Safety.escapeAttr(value) : String(value || '').replace(/"/g, '&quot;'));

  let FIELDS = [
    { id: 'developer', icon: '💻', key: 'fields.developer' },
    { id: 'designer', icon: '🎨', key: 'fields.designer' },
    { id: 'marketing', icon: '📱', key: 'fields.marketing' },
    { id: 'accountant', icon: '📊', key: 'fields.accountant' },
    { id: 'hr', icon: '👩‍💼', key: 'fields.hr' },
    { id: 'other', icon: '✨', key: 'fields.other' }
  ];

  const LEVELS = [
    { id: 'fresh', icon: '🎯', key: 'levels.fresh' },
    { id: 'junior', icon: '💼', key: 'levels.junior' },
    { id: 'mid', icon: '🚀', key: 'levels.mid' },
    { id: 'senior', icon: '👑', key: 'levels.senior' }
  ];

  const TEMPLATES = [
    { id: 'ai-recommended', name: 'templates.ai-recommended' },
    { id: 'ats', name: 'templates.ats' },
    { id: 'classic', name: 'templates.classic' },
    { id: 'modern', name: 'templates.modern' },
    { id: 'sidebar', name: 'templates.sidebar' },
    { id: 'timeline', name: 'templates.timeline' },
    { id: 'compact', name: 'templates.compact' },
    { id: 'academic', name: 'templates.academic' },
    { id: 'corporate', name: 'templates.corporate' },
    { id: 'executive', name: 'templates.executive' },
    { id: 'elegant', name: 'templates.elegant' },
    { id: 'creative', name: 'templates.creative' },
    { id: 'vibrant', name: 'templates.vibrant' },
    { id: 'canva-teal', name: 'templates.canvaTeal' },
    { id: 'canva-navy', name: 'templates.canvaNavy' },
    { id: 'canva-soft', name: 'templates.canvaSoft' }
  ];

  async function init() {
    career = CareerStorage.load() || CareerNormalize.createEmpty();
    await I18n.init(career.meta?.locale);
    career.meta.locale = career.meta.locale || I18n.getLocale();
    await loadProfessionFields();
    if (typeof I18n.translateDom === 'function') I18n.translateDom();
    
    el('wz-next-btn').onclick = handleNext;
    
    stepIndex = 0;
    renderStep();
    updatePreview();
  }

  function updateProgress() {
    const fill = el('wz-progress-fill');
    const text = el('wz-progress-text');
    if (!fill || !text) return;
    
    // Exclude welcome and done from progress math
    const total = STEPS.length - 2; 
    let current = stepIndex - 1;
    if (current < 0) current = 0;
    if (current > total) current = total;
    
    const pct = Math.round((current / total) * 100);
    fill.style.width = `${pct}%`;
    text.innerText = `${pct}%`;
  }

  function updatePreview() {
    if (typeof CVRenderer === 'undefined') return;
    const target = el('cv-render-target');
    if (!target) return;
    target.innerHTML = '';
    // Use fallback if template is ai-recommended
    const tId = career.meta.templateId === 'ai-recommended' ? 'classic' : career.meta.templateId;
    CVRenderer.render(career, tId, target);
  }

  function saveAndPreview() {
    CareerStorage.save(career);
    updatePreview();
  }
  async function loadProfessionFields() {
    try {
      const response = await fetch('/knowledge-base/registry.json');
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const registry = await response.json();
      const locale = career.meta?.locale || I18n.getLocale();
      const professions = Object.values(registry.professions || {});
      if (!professions.length) return;
      FIELDS = professions.map(item => ({
        id: item.id,
        icon: item.icon || '?',
        label: item.name?.[locale] || item.name?.en || item.id
      }));
    } catch (error) {
      console.warn('Using fallback profession list:', error);
    }
  }

  function renderWizardCoach(step) {
    if (typeof AICoach === 'undefined') return '';
    const guidance = AICoach.getWizardGuidance(career, step);
    const coachLabel = career.meta?.locale === 'ar' ? 'عبود Studio' : 'Aboud Studio';
    return `
      <aside class="wz-ai-coach" id="wz-ai-coach">
        <div class="wz-ai-coach-kicker">${h(coachLabel)}</div>
        <div class="wz-ai-coach-title">${h(guidance.title)}</div>
        <div class="wz-ai-coach-body">${h(guidance.body)}</div>
        <div class="wz-ai-coach-feedback" id="wz-ai-feedback" style="display:none"></div>
      </aside>
    `;
  }

  function updateCoachFeedback(step, value) {
    if (typeof AICoach === 'undefined') return;
    const feedbackEl = el('wz-ai-feedback');
    if (!feedbackEl) return;
    const feedback = AICoach.analyzeWizardInput(career, step, value);
    if (!feedback) {
      feedbackEl.style.display = 'none';
      feedbackEl.textContent = '';
      feedbackEl.className = 'wz-ai-coach-feedback';
      return;
    }
    feedbackEl.style.display = 'block';
    feedbackEl.textContent = feedback.message;
    feedbackEl.className = `wz-ai-coach-feedback ${feedback.tone || 'info'}`;
  }


  function showError(msg) {
    const err = el('wz-error');
    err.innerText = msg;
    err.style.display = 'block';
    err.style.animation = 'shake 0.4s';
    setTimeout(() => err.style.animation = '', 400);
  }

  function hideError() {
    el('wz-error').style.display = 'none';
  }

  async function handleNext() {
    hideError();
    const step = STEPS[stepIndex];
    let valid = true;

    // Validation & Data Extraction before moving next
    switch (step) {
      case 'name':
        const nameVal = el('wz-input-name').value.trim();
        if (!nameVal) { valid = false; showError(t('wz.errRequired')); }
        else { career.personalInfo.name = nameVal; }
        break;
      case 'experience_years':
        const lvl = document.querySelector('input[name="wz-level"]:checked');
        if (!lvl) { valid = false; showError(t('wz.errRequired')); }
        else { career.careerProfile.level = lvl.value; }
        break;
      case 'location':
        career.personalInfo.location = el('wz-input-loc').value.trim();
        break;
      case 'email':
        const em = el('wz-input-email').value.trim();
        if (em && !em.includes('@')) { valid = false; showError(t('wz.errEmail')); }
        else { career.personalInfo.email = em; }
        break;
      case 'phone':
        career.personalInfo.phone = el('wz-input-phone').value.trim();
        break;
      case 'linkedin':
        if (!career.personalInfo.links) career.personalInfo.links = {};
        career.personalInfo.links.linkedin = el('wz-input-linkedin').value.trim();
        break;
      case 'github':
        if (!career.personalInfo.links) career.personalInfo.links = {};
        career.personalInfo.links.github = el('wz-input-github').value.trim();
        break;
      case 'education':
        const edu = el('wz-input-edu').value.trim();
        if (edu) {
          career.education = [{ degree: edu, school: '', year: '' }];
        }
        break;
      case 'experience':
        const exp = el('wz-input-exp').value.trim();
        if (exp) {
          career.experience = [{ role: exp, company: '', period: '', bullets: [] }];
        }
        break;
      case 'projects':
        const proj = el('wz-input-proj').value.trim();
        if (proj) {
          career.projects = [CareerNormalize.normalizeProject({ name: proj })];
        }
        break;
      case 'skills':
        const sk = el('wz-input-skills').value.trim();
        if (sk) {
          career.skills = { core: sk.split(',').map(s => s.trim()).filter(Boolean) };
        }
        break;
    }

    if (!valid) return;

    saveAndPreview();

    if (stepIndex < STEPS.length - 1) {
      stepIndex++;
      while (shouldSkipStep(STEPS[stepIndex])) stepIndex++;
      renderStep();
    } else if (step === 'done') {
      window.location.href = 'editor.html';
    }
  }

  // Bind live preview to input
  function bindLiveInput(id, obj, prop, isNested = false) {
    const input = el(id);
    if (!input) return;
    input.addEventListener('input', (e) => {
      if (isNested) {
        if (obj === 'links') {
          if (!career.personalInfo.links) career.personalInfo.links = {};
          career.personalInfo.links[prop] = e.target.value;
        } else {
          career[obj][prop] = e.target.value;
        }
      } else {
        if (obj === 'education') {
          if (!career.education || !career.education.length) career.education = [{ degree: '', school: '', year: '' }];
          career.education[0].degree = e.target.value;
        } else if (obj === 'experience') {
          if (!career.experience || !career.experience.length) career.experience = [{ role: '', company: '', period: '', bullets: [] }];
          career.experience[0].role = e.target.value;
        } else if (obj === 'projects') {
          if (!career.projects || !career.projects.length) career.projects = [{ name: '', desc: '', tech: '', links: {} }];
          career.projects[0].name = e.target.value;
        } else if (obj === 'skills') {
          career.skills = { core: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
        }
      }
      updatePreview();
      updateCoachFeedback(STEPS[stepIndex], e.target.value);
    });
  }

  function renderStep() {
    const area = el('wz-content-area');
    const step = STEPS[stepIndex];
    const btn = el('wz-next-btn');
    
    // Animation trigger
    area.className = 'wizard-content-area';
    void area.offsetWidth; 
    area.className = 'wizard-content-area fade-in';
    
    hideError();
    updateProgress();

    btn.innerText = t('wz.next');
    btn.style.display = 'block';

    let html = '';
    const field = career.careerProfile?.field || 'developer';
    const lang = career.meta?.locale || document.documentElement.lang || 'ar';
    const phObj = window.getProfessionPlaceholders ? window.getProfessionPlaceholders(field, lang) : {};

    switch (step) {
      case 'welcome':
        html = `
          <h1 class="wz-title">${t('welcome.title')}</h1>
          <p class="wz-subtitle">${t('welcome.subtitle')}</p>
        `;
        btn.innerText = t('letsStart');
        break;

      case 'locale':
        html = `
          <h1 class="wz-title">${t('wz.stepLang')}</h1>
          <div class="wz-options">
            <button class="wz-option-btn" onclick="Wizard.setLang('en')">English</button>
            <button class="wz-option-btn" onclick="Wizard.setLang('ar')">العربية</button>
          </div>
        `;
        btn.style.display = 'none'; 
        break;

      case 'name':
        html = `
          <div class="wz-encouragement">${t('wz.msgGreat')}</div>
          <h1 class="wz-title">${t('wz.stepName')}</h1>
          <input type="text" id="wz-input-name" class="wz-input-huge" placeholder="${t('wz.stepNamePh')}" value="${a(career.personalInfo?.name || '')}" autofocus>
        `;
        setTimeout(() => bindLiveInput('wz-input-name', 'personalInfo', 'name', true), 0);
        break;

      case 'nice_to_meet':
        html = `
          <h1 class="wz-title-heart">${h(t('wz.stepNice').replace('{name}', career.personalInfo?.name || ''))}</h1>
        `;
        setTimeout(handleNext, 1800); 
        btn.style.display = 'none';
        break;

      case 'field':
        html = `
          <h1 class="wz-title">${t('wz.stepJob')}</h1>
          <div class="wz-grid-options">
            ${FIELDS.map(f => `
              <label class="wz-grid-card">
                <input type="radio" name="wz-field" value="${f.id}" ${career.careerProfile?.field === f.id ? 'checked' : ''} onchange="Wizard.setField('${f.id}')">
                <span class="wz-card-icon">${h(f.icon)}</span>
                <span class="wz-card-label">${h(f.label || t(f.key))}</span>
              </label>
            `).join('')}
          </div>
        `;
        btn.style.display = 'none';
        break;

      case 'experience_years':
        html = `
          <h1 class="wz-title">${t('wz.stepExpYears')}</h1>
          <div class="wz-list-options">
            ${LEVELS.map(l => `
              <label class="wz-list-card">
                <input type="radio" name="wz-level" value="${l.id}" ${career.careerProfile?.level === l.id ? 'checked' : ''}>
                <span class="wz-card-icon">${l.icon}</span>
                <span class="wz-card-label">${t(l.key)}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;

      case 'location':
        html = `
          <h1 class="wz-title">${t('wz.stepLocation')}</h1>
          <input type="text" id="wz-input-loc" class="wz-input-huge" placeholder="${t('wz.stepLocationPh')}" value="${a(career.personalInfo?.location || '')}" autofocus>
        `;
        setTimeout(() => bindLiveInput('wz-input-loc', 'personalInfo', 'location', true), 0);
        break;

      case 'email':
        html = `
          <h1 class="wz-title">${t('wz.stepEmail')}</h1>
          <input type="email" id="wz-input-email" class="wz-input-huge" placeholder="${t('wz.stepEmailPh')}" value="${a(career.personalInfo?.email || '')}" autofocus>
        `;
        setTimeout(() => bindLiveInput('wz-input-email', 'personalInfo', 'email', true), 0);
        break;

      case 'phone':
        html = `
          <h1 class="wz-title">${t('wz.stepPhone')}</h1>
          <input type="tel" id="wz-input-phone" class="wz-input-huge" placeholder="${t('wz.stepPhonePh')}" value="${a(career.personalInfo?.phone || '')}" autofocus>
        `;
        setTimeout(() => bindLiveInput('wz-input-phone', 'personalInfo', 'phone', true), 0);
        break;

      case 'linkedin':
        html = `
          <div class="wz-encouragement">${t('wz.msgLookingGood')}</div>
          <h1 class="wz-title">${t('wz.stepLinkedin')}</h1>
          <input type="url" id="wz-input-linkedin" class="wz-input-huge" placeholder="${t('wz.stepLinkedinPh')}" value="${a(career.personalInfo?.links?.linkedin || '')}" autofocus>
        `;
        setTimeout(() => bindLiveInput('wz-input-linkedin', 'links', 'linkedin', true), 0);
        btn.innerText = t('wz.skip');
        break;

      case 'github':
        const currentField = career.careerProfile?.field || '';
        const isGithubField = GITHUB_FIELDS.includes(currentField);
        html = `
          <h1 class="wz-title">${isGithubField ? t('wz.stepGithub') : (career.meta?.locale === 'ar' ? 'عندك رابط أعمال أو صفحة مهنية؟' : 'Do you have a portfolio or professional page?')}</h1>
          <input type="url" id="wz-input-github" class="wz-input-huge" placeholder="${isGithubField ? t('wz.stepGithubPh') : 'https://...'}" value="${a(career.personalInfo?.links?.github || '')}" autofocus>
        `;
        setTimeout(() => bindLiveInput('wz-input-github', 'links', 'github', true), 0);
        btn.innerText = t('wz.skip');
        break;

      case 'education':
        html = `
          <h1 class="wz-title">${t('wz.stepEdu')}</h1>
          <input type="text" id="wz-input-edu" class="wz-input-huge" placeholder="${phObj.degree || t('wz.stepEduPh')}" value="${a(career.education?.[0]?.degree || '')}" autofocus>
        `;
        setTimeout(() => bindLiveInput('wz-input-edu', 'education', '', false), 0);
        break;

      case 'experience':
        html = `
          <h1 class="wz-title">${t('wz.stepExp')}</h1>
          <input type="text" id="wz-input-exp" class="wz-input-huge" placeholder="${phObj.title || t('wz.stepExpPh')}" value="${a(career.experience?.[0]?.role || '')}" autofocus>
        `;
        setTimeout(() => bindLiveInput('wz-input-exp', 'experience', '', false), 0);
        btn.innerText = t('wz.skip');
        break;

      case 'projects':
        html = `
          <div class="wz-encouragement">${t('wz.msgFewMore')}</div>
          <h1 class="wz-title">${t('wz.stepProj')}</h1>
          <input type="text" id="wz-input-proj" class="wz-input-huge" placeholder="${phObj.projName || t('wz.stepProjPh')}" value="${a(career.projects?.[0]?.name || '')}" autofocus>
        `;
        setTimeout(() => bindLiveInput('wz-input-proj', 'projects', '', false), 0);
        btn.innerText = t('wz.skip');
        break;

      case 'skills':
        html = `
          <div class="wz-encouragement">${t('wz.msgAlmost')}</div>
          <h1 class="wz-title">${t('wz.stepSkills')}</h1>
          <input type="text" id="wz-input-skills" class="wz-input-huge" placeholder="${phObj.skills || t('wz.stepSkillsPh')}" value="${a((career.skills?.core || []).join(', '))}" autofocus>
        `;
        setTimeout(() => bindLiveInput('wz-input-skills', 'skills', '', false), 0);
        break;

      case 'template':
        html = `
          <h1 class="wz-title">${t('wz.stepTemplate')}</h1>
          <div class="wz-grid-options template-grid">
            ${TEMPLATES.map(tmp => `
              <label class="wz-grid-card">
                <input type="radio" name="wz-template" value="${tmp.id}" ${career.meta.templateId === tmp.id ? 'checked' : ''} onchange="Wizard.setTemplate('${tmp.id}')">
                <span class="wz-card-label">${h(t(tmp.name))}</span>
              </label>
            `).join('')}
          </div>
        `;
        break;

      case 'done':
        html = `
          <div class="wz-done-icon">🎉</div>
          <h1 class="wz-title">${t('wz.msgDone')}</h1>
        `;
        btn.innerText = t('openEditor');
        break;
    }

    if (!['locale', 'nice_to_meet'].includes(step)) html += renderWizardCoach(step);
    area.innerHTML = html;
    
    // Auto focus and handle enter
    const inputs = area.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"]');
    if (inputs.length > 0) {
      setTimeout(() => inputs[0].focus(), 100);
      inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') handleNext();
        });
      });
    }
  }

  // Exposed globals for inline onclick attributes
  function setLang(lang) {
    career.meta.locale = lang;
    I18n.init(lang).then(async () => {
      await loadProfessionFields();
      if (typeof I18n.translateDom === 'function') I18n.translateDom();
      handleNext();
    });
  }

  function setField(fieldId) {
    if (!career.careerProfile) career.careerProfile = {};
    career.careerProfile.field = fieldId;
    const picked = FIELDS.find(item => item.id === fieldId);
    if (!career.personalInfo) career.personalInfo = {};
    if (!career.personalInfo.title && picked?.label) career.personalInfo.title = picked.label;
    handleNext();
  }

  function shouldSkipStep(step) {
    const field = career.careerProfile?.field || '';
    if (step === 'github') return !LINK_PROOF_FIELDS.includes(field);
    if (step === 'projects') return !PROJECT_FIELDS.includes(field);
    return false;
  }

  function setTemplate(tId) {
    if (!career.meta) career.meta = {};
    career.meta.templateId = tId;
    updatePreview();
  }

  return { init, setLang, setField, setTemplate };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof I18n !== 'undefined' && typeof Wizard !== 'undefined') {
    Wizard.init();
  }
});
