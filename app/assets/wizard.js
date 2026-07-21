/**
 * CV Studio — Premium Onboarding Wizard
 */
const Wizard = (function () {
  const STEPS = [
    'locale', 'field', 'experience_years', 'profile',
    'summary', 'education', 'experience', 'projects', 'skills', 'template', 'done'
  ];
  const LINK_PROOF_FIELDS = ['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'marketing', 'data_analyst', 'architect'];
  const GITHUB_FIELDS = ['developer', 'data_analyst'];
  const PROJECT_FIELDS = ['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'marketing', 'data_analyst', 'project_manager', 'business_analyst', 'architect', 'civil_engineer', 'mechanical_engineer', 'electrical_engineer'];

  let career = null;
  let stepIndex = 0;
  let activeTimer = null;

  const el = id => document.getElementById(id);
  const t = (key, fb) => (typeof I18n !== 'undefined' ? I18n.t(key, fb) : fb || key);
  const h = value => (typeof Safety !== 'undefined' ? Safety.escapeHtml(value) : String(value || ''));
  const a = value => (typeof Safety !== 'undefined' ? Safety.escapeAttr(value) : String(value || '').replace(/"/g, '&quot;'));

  function wizardIcon(id) {
    const paths = {
      developer: '<path d="M8 9 4 12l4 3M16 9l4 3-4 3M14 5l-4 14"/>',
      designer: '<circle cx="12" cy="12" r="8"/><circle cx="9" cy="9" r="1"/><circle cx="15" cy="9" r="1"/><path d="M8 15c2 2 6 2 8 0"/>',
      accountant: '<path d="M4 20h16M6 17V9h3v8M11 17V5h3v12M16 17v-6h3v6"/>',
      doctor: '<path d="M12 3v18M3 12h18"/><circle cx="12" cy="12" r="8"/>',
      teacher: '<path d="m3 10 9-5 9 5-9 5z"/><path d="M7 12v5c3 2 7 2 10 0v-5"/>',
      lawyer: '<path d="M12 3v18M6 6h12M5 9l-3 5h6zM19 9l-3 5h6zM8 21h8"/>',
      marketing: '<path d="m4 13 12-6v10L4 13zM4 13v5h4l2 3"/>',
      hr: '<circle cx="9" cy="8" r="3"/><circle cx="17" cy="9" r="2.5"/><path d="M3 20a6 6 0 0 1 12 0M14 20a5 5 0 0 1 8 0"/>',
      engineer: '<path d="M14 6a4 4 0 0 0-5 5L3 17l4 4 6-6a4 4 0 0 0 5-5l-3 3-3-3z"/>',
      fresh: '<path d="M5 18 19 6M8 6h11v11"/>',
      junior: '<path d="M5 20V10h5v10M14 20V4h5v16"/>',
      mid: '<path d="m4 17 5-5 4 3 7-8"/><path d="M15 7h5v5"/>',
      senior: '<path d="M4 18h16M6 18V8l6-4 6 4v10M9 12h6"/>'
    };
    return `<svg class="icon-svg" viewBox="0 0 24 24">${paths[id] || '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M8 12h8"/>'}</svg>`;
  }

  let FIELDS = [
    { id: 'developer', key: 'fields.developer' },
    { id: 'designer', key: 'fields.designer' },
    { id: 'marketing', key: 'fields.marketing' },
    { id: 'accountant', key: 'fields.accountant' },
    { id: 'hr', key: 'fields.hr' },
    { id: 'other', key: 'fields.other' }
  ];

  const LEVELS = [
    { id: 'fresh', key: 'levels.fresh' },
    { id: 'junior', key: 'levels.junior' },
    { id: 'mid', key: 'levels.mid' },
    { id: 'senior', key: 'levels.senior' }
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
    const quickStart = sessionStorage.getItem('cv_studio_quick_start');
    if (quickStart === 'senior') {
      career.careerProfile = career.careerProfile || {};
      career.careerProfile.level = 'senior';
      career.careerProfile.years = '5+';
      career.meta = career.meta || {};
      career.meta.quickStartSenior = true;
      stepIndex = STEPS.indexOf('field');
    }
    await I18n.init(career.meta?.locale);
    career.meta.locale = career.meta.locale || I18n.getLocale();
    await loadProfessionFields();
    if (typeof I18n.translateDom === 'function') I18n.translateDom();
    
    el('wz-next-btn').onclick = handleNext;
    
    if (!career.meta?.quickStartSenior) stepIndex = 0;
    renderStep();
    updatePreview();
  }

  function updateProgress() {
    const fill = el('wz-progress-fill');
    const text = el('wz-progress-text');
    if (!fill || !text) return;
    
    // Exclude done from progress math
    const total = STEPS.length - 1; 
    let current = stepIndex;
    if (current < 0) current = 0;
    if (current > total) current = total;
    
    const pct = Math.round((current / total) * 100);
    fill.style.width = `${pct}%`;
    text.innerText = `${pct}%`;
  }

  function updatePreview() {
    if (typeof CVRenderer === 'undefined') return;
    const target = el('cv-render-target');
    const rightSec = document.querySelector('.wizard-right');
    const leftSec = document.querySelector('.wizard-left');
    if (!target) return;

    const earlySteps = ['locale', 'field', 'experience_years', 'profile'];
    const currentStep = STEPS[stepIndex];
    if (earlySteps.includes(currentStep)) {
      if (rightSec) rightSec.style.display = 'none';
      if (leftSec) {
        leftSec.style.maxWidth = '640px';
        leftSec.style.margin = '0 auto';
      }
      return;
    } else {
      if (rightSec) rightSec.style.display = 'flex';
      if (leftSec) {
        leftSec.style.maxWidth = '800px';
        leftSec.style.margin = '0 auto';
      }
    }

    target.innerHTML = '';
    const tId = career.meta.templateId === 'ai-recommended' ? 'classic' : career.meta.templateId;
    try {
      CVRenderer.render(career, tId, target);
    } catch (err) {
      console.warn('Preview render fallback:', err);
    }
  }

  function saveAndPreview() {
    try {
      CareerStorage.save(career);
      updatePreview();
    } catch (err) {
      console.warn('saveAndPreview fallback:', err);
    }
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
    const coachLabel = career.meta?.locale === 'ar' ? 'مساعد السيرة' : 'Resume Coach';
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
    if (activeTimer) { clearTimeout(activeTimer); activeTimer = null; }
    hideError();
    const step = STEPS[stepIndex];
    let valid = true;

    // Validation & Data Extraction before moving next
    switch (step) {
      case 'profile': {
        if (!career.personalInfo) career.personalInfo = {};
        const nameVal = el('wz-input-name')?.value?.trim() || '';
        const titleVal = el('wz-input-title')?.value?.trim() || '';
        const emailVal = el('wz-input-email')?.value?.trim() || '';
        if (!nameVal) { valid = false; showError(t('wz.errRequired')); break; }
        if (emailVal && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) { valid = false; showError(t('wz.errEmail')); break; }
        career.personalInfo.name = nameVal;
        career.personalInfo.title = titleVal;
        career.personalInfo.email = emailVal;
        career.personalInfo.phone = el('wz-input-phone')?.value?.trim() || '';
        career.personalInfo.location = el('wz-input-loc')?.value?.trim() || '';
        career.personalInfo.links = career.personalInfo.links || {};
        career.personalInfo.links.linkedin = el('wz-input-linkedin')?.value?.trim() || '';
        if (el('wz-input-github')) career.personalInfo.links.github = el('wz-input-github')?.value?.trim() || '';
        break;
      }
      case 'summary': {
        const summary = el('wz-input-summary')?.value?.trim() || '';
        career.professionalSummary = summary;
        break;
      }
      case 'education': {
        const degree = el('wz-input-edu-degree')?.value?.trim() || '';
        const school = el('wz-input-edu-school')?.value?.trim() || '';
        const year = el('wz-input-edu-year')?.value?.trim() || '';
        if (degree || school || year) {
          career.education = [{ degree, school, year }];
        }
        break;
      }
      case 'experience': {
        const role = el('wz-input-exp-role')?.value?.trim() || '';
        const company = el('wz-input-exp-company')?.value?.trim() || '';
        const period = el('wz-input-exp-period')?.value?.trim() || '';
        const rawDescription = el('wz-input-exp-desc')?.value?.trim() || '';
        if (role || company || period || rawDescription) {
          career.experience = [{ role, company, period, rawDescription, bullets: rawDescription.split(/\n+/).map(x => x.trim()).filter(Boolean) }];
        }
        break;
      }
      case 'projects': {
        const name = el('wz-input-proj')?.value?.trim() || '';
        const role = el('wz-input-proj-role')?.value?.trim() || '';
        const tech = el('wz-input-proj-tech')?.value?.trim() || '';
        const desc = el('wz-input-proj-desc')?.value?.trim() || '';
        if (name || role || tech || desc) {
          career.projects = [{
            name,
            role,
            tech,
            technologies: tech.split(/[,،]/).map(x => x.trim()).filter(Boolean),
            desc,
            description: desc,
            bullets: desc.split(/\n+/).map(x => x.trim()).filter(Boolean)
          }];
        } else {
          career.projects = [];
        }
        break;
      }

      case 'skills': {
        const typed = el('wz-input-skills')?.value?.trim() || '';
        if (typed) addCustomSkill();
        const all = getWizardSkills();
        if (all.length) career.skills = { [career.meta?.locale === 'ar' ? 'المهارات الأساسية' : 'Core Skills']: all };
        break;
      }
    }
    if (!valid) return;

    saveAndPreview();

    if (stepIndex < STEPS.length - 1) {
      stepIndex++;
      while (shouldSkipStep(STEPS[stepIndex])) stepIndex++;
      renderStep();
    } else if (step === 'done') {
      sessionStorage.removeItem('cv_studio_quick_start');
      if (career.meta) delete career.meta.quickStartSenior;
      CareerStorage.save(career);
      window.location.href = 'editor.html';
    }
  }

  function handlePrev() {
    if (activeTimer) { clearTimeout(activeTimer); activeTimer = null; }
    hideError();
    if (stepIndex === 0) {
      window.location.href = 'landing.html';
      return;
    }
    
    do {
      stepIndex--;
    } while (stepIndex > 0 && shouldSkipStep(STEPS[stepIndex]));
    
    if (stepIndex < 0) {
      window.location.href = 'landing.html';
      return;
    }
    
    renderStep();
  }

  // Bind live preview to input
  function bindLiveInput(id, obj, prop, isNested = false) {
    const input = el(id);
    if (!input) return;
    input.addEventListener('input', (e) => {
      if (obj === 'professionalSummary') {
        career.professionalSummary = e.target.value;
      } else if (isNested) {
        if (obj === 'links') {
          if (!career.personalInfo) career.personalInfo = {};
          if (!career.personalInfo.links) career.personalInfo.links = {};
          career.personalInfo.links[prop] = e.target.value;
        } else {
          if (!career[obj]) career[obj] = {};
          career[obj][prop] = e.target.value;
        }
      } else {
        if (obj === 'education') {
          if (!career.education || !career.education.length) career.education = [{ degree: '', school: '', year: '' }];
          career.education[0][prop || 'degree'] = e.target.value;
        } else if (obj === 'experience') {
          if (!career.experience || !career.experience.length) career.experience = [{ role: '', company: '', period: '', bullets: [], rawDescription: '' }];
          career.experience[0][prop || 'role'] = e.target.value;
          if ((prop || 'role') === 'rawDescription') career.experience[0].bullets = e.target.value.split(/\n+/).map(x=>x.trim()).filter(Boolean);
        } else if (obj === 'projects') {
          if (!career.projects || !career.projects.length) career.projects = [{ name: '', desc: '', tech: '', role: '', bullets: [], links: {} }];
          const projectProp = prop || 'name';
          career.projects[0][projectProp] = e.target.value;
          if (projectProp === 'desc') {
            career.projects[0].description = e.target.value;
            career.projects[0].bullets = e.target.value.split(/\n+/).map(line => line.trim()).filter(Boolean);
          }
          if (projectProp === 'tech') career.projects[0].technologies = e.target.value.split(/[,،]/).map(item => item.trim()).filter(Boolean);
        } else if (obj === 'skills') {
          career.skills = { core: e.target.value.split(',').map(s => s.trim()).filter(Boolean) };
        }
      }
      updatePreview();
      updateCoachFeedback(STEPS[stepIndex], e.target.value);
    });
  }

  function renderStep() {
    if (activeTimer) { clearTimeout(activeTimer); activeTimer = null; }
    const area = el('wz-content-area');
    const step = STEPS[stepIndex];
    const btn = el('wz-next-btn');
    
    // Animation trigger
    area.className = 'wizard-content-area';
    void area.offsetWidth; 
    area.className = 'wizard-content-area fade-in';
    
    hideError();
    updateProgress();
    updatePreview();

    btn.innerText = t('wz.next');
    btn.style.display = 'block';

    let html = '';
    const field = career.careerProfile?.field || 'developer';
    const lang = career.meta?.locale || document.documentElement.lang || 'ar';
    const phObj = window.getProfessionPlaceholders ? window.getProfessionPlaceholders(field, lang) : {};

    switch (step) {
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

      case 'field': {
        const isAr = career.meta?.locale === 'ar';
        html = `
          <div class="wz-encouragement">${isAr ? 'الاختيار ده بيخصص الأسئلة والنصائح حسب شغلك' : 'This choice personalizes the questions and advice for your career'}</div>
          <h1 class="wz-title">${isAr ? 'ما مجالك المهني؟' : 'What is your profession?'}</h1>
          <p class="wz-subtitle">${isAr ? 'اختار أقرب مجال. تقدر تغيّره لاحقاً من المحرر.' : 'Choose the closest field. You can change it later in the editor.'}</p>
          <div class="wz-grid-options" dir="${isAr ? 'rtl' : 'ltr'}">
            ${FIELDS.map(item => {
              const label = item.label || t(item.key, item.id);
              return `<button type="button" class="wz-grid-card" onclick="Wizard.setField('${a(item.id)}')" aria-label="${a(label)}">
                <span class="wz-card-icon" aria-hidden="true">${wizardIcon(item.id)}</span>
                <span class="wz-card-label">${h(label)}</span>
              </button>`;
            }).join('')}
          </div>
        `;
        btn.style.display = 'none';
        break;
      }

      case 'experience_years': {
        const isAr = career.meta?.locale === 'ar';
        html = `
          <div class="wz-encouragement">${isAr ? 'هنغيّر نوع النصائح حسب مرحلتك الحقيقية' : 'We will adapt the advice to your actual career stage'}</div>
          <h1 class="wz-title">${isAr ? 'ما مستوى خبرتك؟' : 'What is your experience level?'}</h1>
          <p class="wz-subtitle">${isAr ? 'اختار الأقرب لخبرتك الحالية، مش للمسمى اللي بتتمنى توصله.' : 'Choose what best reflects your current experience, not only your desired title.'}</p>
          <div class="wz-list-options" dir="${isAr ? 'rtl' : 'ltr'}">
            ${LEVELS.map(item => `<button type="button" class="wz-list-card" onclick="Wizard.setLevel('${a(item.id)}')" aria-label="${a(t(item.key, item.id))}">
              <span class="wz-card-icon" aria-hidden="true">${wizardIcon(item.id)}</span>
              <span class="wz-card-label">${h(t(item.key, item.id))}</span>
            </button>`).join('')}
          </div>
        `;
        btn.style.display = 'none';
        break;
      }

      case 'profile': {
        const curField = career.careerProfile?.field || 'other';
        const showLinks = LINK_PROOF_FIELDS.includes(curField);
        html = `
          <div class="wz-encouragement">${career.meta?.locale === 'ar' ? 'خطوة واحدة ونجهز هويتك المهنية' : 'One step to set up your professional identity'}</div>
          <h1 class="wz-title">${career.meta?.locale === 'ar' ? 'الملف الأساسي' : 'Basic Profile'}</h1>
          <p class="wz-subtitle">${career.meta?.locale === 'ar' ? 'اكتب بياناتك مرة واحدة. ستقدر تعدلها لاحقاً من المحرر.' : 'Enter these details once. You can edit them later in the editor.'}</p>
          <div class="wz-profile-grid" dir="${career.meta?.locale === 'ar' ? 'rtl' : 'ltr'}">
            <div class="wz-profile-field wz-profile-full"><label>${career.meta?.locale === 'ar' ? 'الاسم الكامل *' : 'Full name *'}</label><input type="text" id="wz-input-name" class="wz-input-huge" placeholder="${t('wz.stepNamePh')}" value="${a(career.personalInfo?.name || '')}"></div>
            <div class="wz-profile-field wz-profile-full"><label>${career.meta?.locale === 'ar' ? 'المسمى الوظيفي المستهدف' : 'Target job title'}</label><input type="text" id="wz-input-title" class="wz-input-huge" placeholder="${a(phObj.title || (career.meta?.locale === 'ar' ? 'مثال: محاسب مالي' : 'e.g. Financial Accountant'))}" value="${a(career.personalInfo?.title || '')}"></div>
            <div class="wz-profile-field"><label>${career.meta?.locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label><input type="email" id="wz-input-email" class="wz-input-huge" placeholder="you@example.com" value="${a(career.personalInfo?.email || '')}"></div>
            <div class="wz-profile-field"><label>${career.meta?.locale === 'ar' ? 'رقم الهاتف' : 'Phone'}</label><input type="tel" id="wz-input-phone" class="wz-input-huge" placeholder="+20 100 000 0000" value="${a(career.personalInfo?.phone || '')}"></div>
            <div class="wz-profile-field wz-profile-full"><label>${career.meta?.locale === 'ar' ? 'المدينة والدولة' : 'City and country'}</label><input type="text" id="wz-input-loc" class="wz-input-huge" placeholder="${career.meta?.locale === 'ar' ? 'القاهرة، مصر' : 'Cairo, Egypt'}" value="${a(career.personalInfo?.location || '')}"></div>
            <div class="wz-profile-field wz-profile-full"><label>LinkedIn <span>${career.meta?.locale === 'ar' ? '(اختياري)' : '(optional)'}</span></label><input type="url" id="wz-input-linkedin" class="wz-input-huge" placeholder="https://linkedin.com/in/..." value="${a(career.personalInfo?.links?.linkedin || '')}"></div>
            ${showLinks ? `<div class="wz-profile-field wz-profile-full"><label>${GITHUB_FIELDS.includes(curField) ? 'GitHub' : (career.meta?.locale === 'ar' ? 'Portfolio / رابط الأعمال' : 'Portfolio')} <span>${career.meta?.locale === 'ar' ? '(اختياري)' : '(optional)'}</span></label><input type="url" id="wz-input-github" class="wz-input-huge" placeholder="https://..." value="${a(career.personalInfo?.links?.github || '')}"></div>` : ''}
          </div>
        `;
        setTimeout(() => {
          bindLiveInput('wz-input-name', 'personalInfo', 'name', true);
          bindLiveInput('wz-input-title', 'personalInfo', 'title', true);
          bindLiveInput('wz-input-email', 'personalInfo', 'email', true);
          bindLiveInput('wz-input-phone', 'personalInfo', 'phone', true);
          bindLiveInput('wz-input-loc', 'personalInfo', 'location', true);
          bindLiveInput('wz-input-linkedin', 'links', 'linkedin', true);
          if (el('wz-input-github')) bindLiveInput('wz-input-github', 'links', 'github', true);
        }, 0);
        break;
      }

      case 'summary': {
        const isAr = career.meta?.locale === 'ar';
        const title = career.personalInfo?.title || career.careerProfile?.title || '';
        html = `
          <div class="wz-encouragement">${isAr ? 'نبذة واضحة في 3–4 سطور، مبنية على معلوماتك أنت' : 'A clear 3–4 line summary built from your own facts'}</div>
          <h1 class="wz-title">${isAr ? 'اكتب نبذتك المهنية' : 'Write your professional summary'}</h1>
          <p class="wz-subtitle">${isAr ? 'اكتبها مباشرة، أو املأ الثلاث خانات القصيرة وسيب المساعد يرتبها لك بدون اختراع معلومات.' : 'Write it directly, or use the three factual prompts below to assemble a draft without invented claims.'}</p>
          <textarea id="wz-input-summary" class="wz-textarea-big" rows="6" placeholder="${isAr ? 'مثال: محاسب مالي بخبرة في إعداد القيود والتسويات وإعداد التقارير... اذكر فقط ما عملت به فعلًا.' : 'Example: Financial accountant experienced in reconciliations, entries, and reporting...'}" autofocus>${h(career.professionalSummary || '')}</textarea>
          <div class="wz-profile-grid" style="margin-top:14px" dir="${isAr ? 'rtl' : 'ltr'}">
            <div class="wz-profile-field wz-profile-full"><label>${isAr ? 'أهم مجالات أو مهام عملت بها' : 'Main areas or responsibilities'}</label><input type="text" id="wz-summary-focus" class="wz-input-huge" placeholder="${isAr ? 'مثال: القيود اليومية، التسويات، التقارير المالية' : 'e.g. reconciliations, reporting, journal entries'}"><div class="wz-field-help">${isAr ? 'اكتب كلمتين أو ثلاث مهام حقيقية.' : 'Use two or three factual areas.'}</div></div>
            <div class="wz-profile-field"><label>${isAr ? 'أدوات أو أنظمة تستخدمها' : 'Tools or systems'}</label><input type="text" id="wz-summary-tools" class="wz-input-huge" placeholder="${isAr ? 'مثال: Excel، ERP' : 'e.g. Excel, ERP'}"></div>
            <div class="wz-profile-field"><label>${isAr ? 'ما الذي يميز طريقة عملك؟' : 'How do you add value?'}</label><input type="text" id="wz-summary-value" class="wz-input-huge" placeholder="${isAr ? 'مثال: الدقة، تنظيم البيانات، الالتزام بالمواعيد' : 'e.g. accuracy, organization, deadlines'}"></div>
          </div>
          <div class="wz-inline-actions"><button type="button" onclick="Wizard.buildSummaryDraft()">${isAr ? 'بناء مسودة من إجاباتي' : 'Build a draft from my answers'}</button></div>
          <div class="wz-note-card">${isAr ? `المسمى المستخدم: ${h(title || 'أضف المسمى في الخطوة السابقة')}. راجع المسودة قبل اعتمادها.` : `Using title: ${h(title || 'add your target title first')}. Review the draft before accepting it.`}</div>
        `;
        setTimeout(() => bindLiveInput('wz-input-summary', 'professionalSummary', '', true), 0);
        break;
      }

      case 'education': {
        const edu0 = career.education?.[0] || {};
        const isAr = career.meta?.locale === 'ar';
        html = `
          <h1 class="wz-title">${t('wz.stepEdu')}</h1>
          <p class="wz-subtitle">${isAr ? 'اكتب المؤهل بشكل طبيعي: الدرجة، المؤسسة، السنة.' : 'Add degree, institution, and graduation year.'}</p>
          <div class="wz-profile-grid" dir="${isAr ? 'rtl' : 'ltr'}">
            <div class="wz-profile-field wz-profile-full"><label>${isAr ? 'الدرجة / المؤهل' : 'Degree / qualification'}</label><input type="text" id="wz-input-edu-degree" class="wz-input-huge" placeholder="${phObj.degree || t('wz.stepEduPh')}" value="${a(edu0.degree || '')}" autofocus></div>
            <div class="wz-profile-field"><label>${isAr ? 'الجامعة / المعهد' : 'University / institution'}</label><input type="text" id="wz-input-edu-school" class="wz-input-huge" placeholder="${isAr ? 'مثال: جامعة القاهرة' : 'e.g. Cairo University'}" value="${a(edu0.school || edu0.institution || '')}"></div>
            <div class="wz-profile-field"><label>${isAr ? 'السنة' : 'Year'}</label><input type="text" id="wz-input-edu-year" class="wz-input-huge" placeholder="2024" value="${a(edu0.year || '')}"></div>
          </div>
          ${getStepHintBox('education', field, isAr, career.careerProfile?.level)}
        `;
        setTimeout(() => {
          bindLiveInput('wz-input-edu-degree', 'education', 'degree', false);
          bindLiveInput('wz-input-edu-school', 'education', 'school', false);
          bindLiveInput('wz-input-edu-year', 'education', 'year', false);
        }, 0);
        break;
      }

      case 'experience': {
        const exp0 = career.experience?.[0] || {};
        const isAr = career.meta?.locale === 'ar';
        html = `
          <h1 class="wz-title">${isAr ? 'أضف أحدث خبرة' : 'Add your latest experience'}</h1>
          <p class="wz-subtitle">${isAr ? 'الخبرة قد تكون وظيفة أو تدريبًا أو عملًا حرًا أو تطوعًا. اكتب 2–4 نقاط قصيرة تصف ما فعلته فعلًا.' : 'Experience can be a job, internship, freelance work, or volunteering. Add 2–4 factual bullets.'}</p>
          <div class="wz-profile-grid" dir="${isAr ? 'rtl' : 'ltr'}">
            <div class="wz-profile-field"><label>${isAr ? 'المسمى أو الدور' : 'Role'}</label><input type="text" id="wz-input-exp-role" class="wz-input-huge" placeholder="${phObj.title || t('wz.stepExpPh')}" value="${a(exp0.role || '')}" autofocus></div>
            <div class="wz-profile-field"><label>${isAr ? 'الشركة أو الجهة' : 'Company or organization'}</label><input type="text" id="wz-input-exp-company" class="wz-input-huge" placeholder="${isAr ? 'اسم الشركة، جهة التدريب، أو العميل' : 'Company, training organization, or client'}" value="${a(exp0.company || '')}"></div>
            <div class="wz-profile-field wz-profile-full"><label>${isAr ? 'الفترة' : 'Period'}</label><input type="text" id="wz-input-exp-period" class="wz-input-huge" placeholder="${isAr ? 'مثال: يناير 2023 – الآن' : 'e.g. Jan 2023 – Present'}" value="${a(exp0.period || '')}"></div>
            <div class="wz-profile-field wz-profile-full"><label>${isAr ? 'المهام والإنجازات — نقطة في كل سطر' : 'Responsibilities and outcomes — one bullet per line'}</label><textarea id="wz-input-exp-desc" class="wz-textarea-big" rows="7" placeholder="${isAr ? 'اكتب ما فعلته بصيغة واضحة:&#10;راجعت...&#10;أعددت...&#10;تابعت...&#10;ساهمت في...' : 'Describe what you did:&#10;Reviewed...&#10;Prepared...&#10;Coordinated...&#10;Contributed to...'}">${h(exp0.rawDescription || (exp0.bullets || []).join('\n'))}</textarea><div class="wz-field-help">${isAr ? 'الأفضل: فعل + مهمة + أداة أو نطاق + نتيجة حقيقية إن وجدت.' : 'Best structure: action + task + tool/scope + real outcome when available.'}</div></div>
          </div>
          <div class="wz-inline-actions"><button type="button" onclick="Wizard.showExperienceSuggestions()">${isAr ? 'اعرض اقتراحات مناسبة لدوري' : 'Show role-aware bullet ideas'}</button></div>
          <div id="wz-experience-suggestions" style="display:none"></div>
          ${career.careerProfile?.level === 'fresh' ? `<div class="wz-inline-actions"><button type="button" class="ghost" onclick="Wizard.skipExperienceFresh()">${isAr ? 'ليس لدي وظيفة أو تدريب حتى الآن' : 'I do not have a job or internship yet'}</button></div>` : ''}
          ${getStepHintBox('experience', field, isAr, career.careerProfile?.level)}
        `;
        setTimeout(() => {
          bindLiveInput('wz-input-exp-role', 'experience', 'role', false);
          bindLiveInput('wz-input-exp-company', 'experience', 'company', false);
          bindLiveInput('wz-input-exp-period', 'experience', 'period', false);
          bindLiveInput('wz-input-exp-desc', 'experience', 'rawDescription', false);
        }, 0);
        btn.innerText = isAr ? 'التالي' : t('wz.next');
        break;
      }

      case 'projects': {
        const isAr = career.meta?.locale === 'ar';
        const project = career.projects?.[0] || {};
        html = `
          <div class="wz-encouragement">${isAr ? 'مشروع حقيقي واحد أقوى من قائمة عامة' : 'One genuine project is stronger than a generic list'}</div>
          <h1 class="wz-title">${isAr ? 'أضف مشروعًا يثبت مهارتك' : 'Add a project that proves your skills'}</h1>
          <p class="wz-subtitle">${isAr ? 'أضف المشروع فقط لو شاركت فيه فعلًا. وضّح الهدف ودورك والأدوات وما نفذته أو تعلمته.' : 'Add only a real project. Clarify the goal, your role, tools, and what you delivered or learned.'}</p>
          <div class="wz-profile-grid" dir="${isAr ? 'rtl' : 'ltr'}">
            <div class="wz-profile-field"><label>${isAr ? 'اسم المشروع' : 'Project name'}</label><input type="text" id="wz-input-proj" class="wz-input-huge" placeholder="${phObj.projName || t('wz.stepProjPh')}" value="${a(project.name || '')}" autofocus></div>
            <div class="wz-profile-field"><label>${isAr ? 'دورك في المشروع' : 'Your role'}</label><input type="text" id="wz-input-proj-role" class="wz-input-huge" placeholder="${isAr ? 'مثال: محلل، مصمم، مطور، منسق' : 'e.g. Analyst, Designer, Developer'}" value="${a(project.role || '')}"></div>
            <div class="wz-profile-field wz-profile-full"><label>${isAr ? 'الأدوات أو التقنيات' : 'Tools or technologies'}</label><input type="text" id="wz-input-proj-tech" class="wz-input-huge" placeholder="${phObj.projTech || (isAr ? 'مثال: Excel، Power BI' : 'e.g. Excel, Power BI')}" value="${a(project.tech || (project.technologies || []).join('، '))}"></div>
            <div class="wz-profile-field wz-profile-full"><label>${isAr ? 'ماذا فعلت؟ — نقطة في كل سطر' : 'What did you do? — one bullet per line'}</label><textarea id="wz-input-proj-desc" class="wz-textarea-big" rows="6" placeholder="${isAr ? 'حددت الهدف...&#10;نفذت...&#10;استخدمت...&#10;وصلت إلى أو تعلمت...' : 'Defined the goal...&#10;Delivered...&#10;Used...&#10;Achieved or learned...'}">${h(project.desc || project.description || (project.bullets || []).join('\n'))}</textarea></div>
          </div>
          ${getStepHintBox('projects', field, isAr, career.careerProfile?.level)}
        `;
        setTimeout(() => {
          bindLiveInput('wz-input-proj', 'projects', 'name', false);
          bindLiveInput('wz-input-proj-role', 'projects', 'role', false);
          bindLiveInput('wz-input-proj-tech', 'projects', 'tech', false);
          bindLiveInput('wz-input-proj-desc', 'projects', 'desc', false);
        }, 0);
        btn.innerText = isAr ? 'التالي أو تخطي' : t('wz.skip');
        break;
      }

      case 'skills': {
        const isAr = career.meta?.locale === 'ar';
        const currentSkills = getWizardSkills();
        const suggestions = getWizardSkillSuggestions(field, isAr).slice(0, 14);
        html = `
          <div class="wz-encouragement">${isAr ? 'اختر المهارات التي تستطيع استخدامها وشرحها فعلًا' : 'Choose skills you can genuinely use and discuss'}</div>
          <h1 class="wz-title">${isAr ? 'المهارات الأساسية' : 'Core skills'}</h1>
          <p class="wz-subtitle">${isAr ? 'اضغط على الاقتراح لإضافته، أو اكتب مهارة أخرى. لا نضيف أي مهارة تلقائيًا.' : 'Tap a suggestion to add it, or type another skill. Nothing is added silently.'}</p>
          <div style="display:grid;grid-template-columns:1fr auto;gap:8px;align-items:center">
            <input type="text" id="wz-input-skills" class="wz-input-huge" placeholder="${isAr ? 'اكتب مهارة ثم اضغط إضافة' : 'Type a skill then add it'}" value="">
            <button type="button" class="wz-btn-primary" style="width:auto;min-width:88px;height:48px;padding:0 16px" onclick="Wizard.addCustomSkill()">${isAr ? 'إضافة' : 'Add'}</button>
          </div>
          <div class="wz-selected-skills" id="wz-selected-skills"></div>
          <div class="wz-skill-suggestions">
            ${suggestions.map(sk => `<label class="wz-skill-chip"><input type="checkbox" value="${a(sk)}" ${currentSkills.some(x => x.toLowerCase() === sk.toLowerCase()) ? 'checked' : ''} onchange="Wizard.toggleWizardSkill('${a(sk)}', this.checked)"><span>${h(sk)}</span></label>`).join('')}
          </div>
          <div class="wz-note-card">${isAr ? 'الاقتراحات مبنية على المجال، لكنها ليست متطلبات مؤكدة. اختر فقط ما تمتلكه.' : 'Suggestions are field-based, not verified requirements. Select only what you have.'}</div>
        `;
        setTimeout(() => {
          renderSelectedSkills();
          const input = el('wz-input-skills');
          if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); addCustomSkill(); } });
        }, 0);
        break;
      }

      case 'template': {
        const isAr = career.meta?.locale === 'ar';
        const level = career.careerProfile?.level || 'junior';
        const recommendedId = level === 'senior' ? 'executive' : level === 'mid' ? 'modern' : 'ats';
        const ids = [...new Set([recommendedId, 'ats', 'modern', 'executive'])].slice(0, 3);
        const topTemplates = ids.map(id => TEMPLATES.find(tmp => tmp.id === id)).filter(Boolean);
        if (!topTemplates.some(tmp => tmp.id === career.meta.templateId)) career.meta.templateId = recommendedId;
        html = `
          <h1 class="wz-title">${isAr ? 'اختر شكل السيرة' : 'Choose a resume style'}</h1>
          <p class="wz-subtitle">${isAr ? 'اختر من ثلاث اتجاهات احترافية. يمكنك فتح المعرض الكامل وتغيير الألوان والخطوط لاحقًا.' : 'Choose one of three professional directions. You can change colors and typography later.'}</p>
          <div class="wz-template-preview-grid">
            ${topTemplates.map(tmp => `
              <label class="wz-template-card ${career.meta.templateId === tmp.id ? 'active' : ''}">
                <input type="radio" name="wz-template" value="${tmp.id}" ${career.meta.templateId === tmp.id ? 'checked' : ''} onchange="Wizard.setTemplate('${tmp.id}'); document.querySelectorAll('.wz-template-card').forEach(x=>x.classList.remove('active')); this.closest('.wz-template-card').classList.add('active')">
                <div class="wz-template-thumb wz-template-${tmp.id}">${wizardTemplatePreview(tmp.id)}</div>
                <strong>${h(tmp.id === 'ats' ? (isAr ? 'ATS كلاسيكي' : 'ATS Classic') : tmp.id === 'modern' ? (isAr ? 'حديث ونظيف' : 'Modern Clean') : (isAr ? 'تنفيذي' : 'Executive'))}${tmp.id === recommendedId ? ` <span style="color:#2563eb;font-size:10px">— ${isAr ? 'موصى به' : 'Recommended'}</span>` : ''}</strong>
                <small>${tmp.id === 'ats' ? (isAr ? 'عمود واحد، واضح وسهل القراءة' : 'Single-column and easy to scan') : tmp.id === 'modern' ? (isAr ? 'توازن بصري مع تنظيم قوي' : 'Strong hierarchy and modern balance') : (isAr ? 'حضور أقوى لصاحب الخبرة' : 'Stronger presence for experienced profiles')}</small>
              </label>
            `).join('')}
          </div>
        `;
        break;
      }

      case 'done': {
        const isAr = career.meta?.locale === 'ar';
        const checks = [
          [career.personalInfo?.name && career.personalInfo?.title, isAr ? 'الهوية المهنية' : 'Professional identity'],
          [String(career.professionalSummary || '').trim().length > 60, isAr ? 'النبذة المهنية' : 'Professional summary'],
          [(career.experience || []).length > 0, isAr ? 'الخبرة أو التدريب' : 'Experience or internship'],
          [getWizardSkills().length >= 4, isAr ? 'المهارات الأساسية' : 'Core skills']
        ];
        html = `
          <div class="wz-done-icon" style="background:#ecfdf5;color:#047857">✓</div>
          <h1 class="wz-title">${isAr ? 'النسخة الأولى جاهزة للمراجعة' : 'Your first draft is ready to review'}</h1>
          <p class="wz-subtitle">${isAr ? 'المحرر سيعرض لك الأولويات الحقيقية بدل اعتبار كل قسم مكتملًا بمجرد وجود نص.' : 'The editor will show real priorities instead of marking every non-empty section as complete.'}</p>
          <div class="wz-profile-grid">
            ${checks.map(([ok,label]) => `<div class="wz-profile-field" style="display:flex;align-items:center;gap:10px"><span style="width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:${ok ? '#dcfce7' : '#f1f5f9'};color:${ok ? '#15803d' : '#64748b'};font-weight:900">${ok ? '✓' : '•'}</span><strong>${h(label)}</strong></div>`).join('')}
          </div>
        `;
        btn.innerText = isAr ? 'فتح المحرر ومراجعة السيرة' : t('openEditor');
        break;
      }
    }

    if (step !== 'locale') html += renderWizardCoach(step);
    area.innerHTML = html;
    
    // Auto focus and handle enter
    const inputs = Array.from(area.querySelectorAll('input[type="text"], input[type="email"], input[type="tel"], input[type="url"], textarea'));
    if (inputs.length > 0) {
      setTimeout(() => inputs[0].focus(), 100);
      inputs.forEach((input, index) => {
        input.addEventListener('keydown', event => {
          if (event.key !== 'Enter') return;
          const isTextarea = input.tagName === 'TEXTAREA';
          if (isTextarea && !(event.ctrlKey || event.metaKey)) return;
          event.preventDefault();
          if (index < inputs.length - 1) inputs[index + 1].focus();
          else handleNext();
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
    // The broad profession must not silently become the user's exact target title.
    // The next profile step asks for the precise title once, in the right context.
    handleNext();
  }

  function setLevel(levelId) {
    if (!career.careerProfile) career.careerProfile = {};
    career.careerProfile.level = levelId;
    const yearsByLevel = { fresh: '0', junior: '1-2', mid: '3-5', senior: '5+' };
    career.careerProfile.years = yearsByLevel[levelId] || '';
    handleNext();
  }

  function fillStepInput(inputId, val, stateKey) {
    const elInput = el(inputId);
    if (elInput) {
      elInput.value = val;
      if (stateKey === 'experience') {
        if (!career.experience || !career.experience.length) career.experience = [{ role: '', company: '', period: '', bullets: [] }];
        career.experience[0].role = val;
      } else if (stateKey === 'projects') {
        if (!career.projects || !career.projects.length) career.projects = [{ name: '', description: '' }];
        career.projects[0].name = val;
      } else if (stateKey === 'education') {
        if (!career.education || !career.education.length) career.education = [{ degree: '', school: '', year: '' }];
        career.education[0].degree = val;
      }
      elInput.focus();
    }
  }

  function getStepHintBox(step, curField, isAr, level) {
    const fieldTitles = {
      developer: isAr ? 'تطوير البرمجيات' : 'Software Engineering',
      teacher: isAr ? 'التعليم والتدريس' : 'Teaching & Education',
      accountant: isAr ? 'المحاسبة والمالية' : 'Accounting & Finance',
      doctor: isAr ? 'الطب والرعاية الصحية' : 'Medicine & Healthcare',
      dentist: isAr ? 'طب الأسنان' : 'Dentistry',
      pharmacist: isAr ? 'الصيدلة' : 'Pharmacy',
      nurse: isAr ? 'التمريض والرعاية' : 'Nursing',
      lawyer: isAr ? 'القانون والمحاماة' : 'Legal & Law',
      hr: isAr ? 'الموارد البشرية (HR)' : 'Human Resources',
      marketing: isAr ? 'التسويق الرقمي وإدارة الحملات' : 'Marketing',
      sales: isAr ? 'المبيعات وتطوير الأعمال' : 'Sales & Business Dev',
      customer_service: isAr ? 'خدمة العملاء والدعم' : 'Customer Service',
      graphic_designer: isAr ? 'التصميم الجرافيكي' : 'Graphic Design',
      ui_ux_designer: isAr ? 'تصميم تجربة ومستخدم (UI/UX)' : 'UI/UX Design',
      architect: isAr ? 'الهندسة المعمارية والتصميم' : 'Architecture',
      civil_engineer: isAr ? 'الهندسة المدنية والإنشاءات' : 'Civil Engineering',
      mechanical_engineer: isAr ? 'الهندسة الميكانيكية' : 'Mechanical Engineering',
      electrical_engineer: isAr ? 'الهندسة الكهربائية' : 'Electrical Engineering',
      data_analyst: isAr ? 'تحليل البيانات وذكاء الأعمال' : 'Data Analysis'
    };
    const fName = fieldTitles[curField] || (isAr ? 'مجالك المهني' : 'your field');

    if (step === 'experience') {
      const quickChips = {
        accountant: isAr ? ['محاسب مالي في شركة...', 'متدرب حسابات ومراجعة في...', 'محاسب تكاليف وميزانيات'] : ['Financial Accountant at...', 'Accounting Intern at...', 'Tax & Audit Associate'],
        developer: isAr ? ['مطور واجهات أمامية Frontend في...', 'مطور برمجيات متدرب في...', 'مطور ويب مستقل (Freelance)'] : ['Frontend Developer at...', 'Software Engineering Intern', 'Full Stack Freelancer'],
        teacher: isAr ? ['معلم مرحلة... في مدرسة...', 'مدرس ومطور مناهج تفاعلية', 'متدرب تدريس وإشراف تربوي'] : ['Teacher at...', 'Curriculum Developer', 'Education Intern'],
        sales: isAr ? ['أخصائي مبيعات وعلاقات عملاء في...', 'مندوب مبيعات كبار العملاء', 'متدرب تطوير أعمال ومبيعات'] : ['Sales Representative at...', 'Account Executive', 'Sales Intern'],
        marketing: isAr ? ['أخصائي تسويق رقمي وإدارة حملات', 'صانع محتوى وسوشيال ميديا في...', 'متدرب تسويق وتحليل أداء'] : ['Digital Marketing Specialist at...', 'Content Marketer', 'Marketing Intern'],
        customer_service: isAr ? ['ممثل خدمة عملاء ودعم فني في...', 'أخصائي تجربة عملاء', 'متدرب كول سنتر ودعم'] : ['Customer Service Representative at...', 'Technical Support Specialist', 'CS Intern'],
        graphic_designer: isAr ? ['مصمم جرافيك وهوية بصرية في...', 'مصمم وسائط ومحتوى رقمي حر', 'متدرب تصميم جرافيك'] : ['Graphic Designer at...', 'Visual Identity Freelancer', 'Design Intern'],
        ui_ux_designer: isAr ? ['مصمم تجربة ومستخدم UI/UX في...', 'متدرب تصميم واجهات وتطبيقات', 'مصمم منتجات رقمية حر'] : ['UI/UX Designer at...', 'Product Design Intern', 'Freelance UX Researcher'],
        hr: isAr ? ['أخصائي موارد بشرية وتوظيف في...', 'مسؤول شؤون عاملين ورواتب', 'متدرب موارد بشرية واستقطاب'] : ['HR Specialist at...', 'Talent Acquisition Coordinator', 'HR Intern'],
        doctor: isAr ? ['طبيب مقيم في مستشفى...', 'طبيب عام ومكافحة عدوى', 'متدرب امتياز بالمستشفيات الجامعية'] : ['Resident Physician at...', 'General Practitioner', 'Medical Intern'],
        pharmacist: isAr ? ['صيدلي إكلينيكي في مستشفى/صيدلية...', 'أخصائي معلومات دوائية وجرد', 'متدرب صيدلة ومبيعات طبية'] : ['Clinical Pharmacist at...', 'Community Pharmacist', 'Pharmacy Intern'],
        lawyer: isAr ? ['محامٍ ومستشار قانوني في...', 'باحث وصائغ عقود قانونية', 'متدرب شؤون قانونية وقضايا'] : ['Legal Counsel at...', 'Associate Attorney', 'Legal Intern'],
        civil_engineer: isAr ? ['مهندس مدني وتطوير موقع في...', 'مهندس مكتب فني وحصر كميات', 'متدرب هندسة مدنية وإنشاءات'] : ['Civil Engineer at...', 'Site Engineer', 'Civil Engineering Intern'],
        data_analyst: isAr ? ['محلل بيانات وتطوير تقارير BI في...', 'أخصائي تحليل وقواعد بيانات', 'متدرب علم وتحليل بيانات'] : ['Data Analyst at...', 'BI Developer', 'Data Analysis Intern']
      };
      const chips = quickChips[curField] || (isAr ? ['أخصائي أول في شركة...', 'متدرب في قسم...', 'عمل حر ومشاريع عملية'] : ['Specialist at...', 'Intern at...', 'Freelance Consultant']);

      return `
        <div style="margin-top:20px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-${isAr ? 'right' : 'left'}:4px solid #2563eb;border-radius:12px;font-size:13px;line-height:1.7;color:#334155;text-align:${isAr ? 'right' : 'left'};">
          <div style="font-weight:800;color:#0f172a;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <span class="wz-tip-mark">i</span> <span>${isAr ? 'تلميحات هامة لكتابة خبرتك بقوة وسهولة:' : 'Pro Tips for Writing Your Experience:'}</span>
          </div>
          <ul style="margin:0;padding-${isAr ? 'right' : 'left'}:20px;list-style-type:disc;color:#475569;">
            <li style="margin-bottom:6px;"><strong>${isAr ? 'التدريب والمشاريع العملية والأعمال الحرة يُحسبوا' : 'Internships, practical projects & freelancing count'}</strong> ${isAr ? 'كخبرة حقيقية في سيرتك، لا تتردد في كتابتهم إذا كنت في بداية مسيرتك.' : 'as real experience! Don’t hesitate to list them.'}</li>
            <li style="margin-bottom:6px;">${isAr ? 'في مجال' : 'In'} <strong>${fName}</strong>، ${isAr ? 'الجملة القوية لازم تبين <strong>فعل وإنجاز أو نتيجة</strong> (مثلاً: قمت بتطوير/إدارة/تحسين... مما أدى إلى...).' : 'a strong bullet must show <strong>action + measurable result</strong> (e.g. Developed/Managed... resulting in...).'}</li>
          </ul>
          <div style="margin-top:14px;font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px;">${isAr ? 'اختر مثالاً كبداية ثم عدّله ليطابق خبرتك:' : 'Choose a starter example, then edit it to match your experience:'}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${chips.map(ch => `<button type="button" onclick="Wizard.fillStepInput('wz-input-exp-role', '${h(ch)}', 'experience')" style="padding:6px 12px;background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;font-weight:600;color:#2563eb;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='#fff'">+ ${h(ch)}</button>`).join('')}
          </div>
        </div>
      `;
    }

    if (step === 'projects') {
      const quickProj = {
        developer: isAr ? ['تطبيق إدارة مهام ومبيعات متكامل', 'موقع تجارة إلكترونية كامل وتفاعلي', 'نظام API وتوثيق بيانات باستخدام Node/Python'] : ['E-Commerce Web Application', 'Task Management Dashboard', 'RESTful API Platform'],
        teacher: isAr ? ['تصميم منهج وأنشطة تفاعلية لطلاب المرحلة...', 'مبادرة تحسين مهارات القراءة والاستيعاب', 'تطبيق استراتيجية التعلم النشط والفصول المقلوبة'] : ['Interactive Curriculum Design Project', 'Student Literacy & Reading Program', 'Active Learning & Gamification Workshop'],
        accountant: isAr ? ['بناء نموذج تحليل مالي وتوقعات على Excel/Power BI', 'دراسة جدوى وميزانية تقديرية لمشروع ناشئ', 'تطوير نظام أرشفة وضبط دورة المستندات المالية'] : ['Financial Dashboard & Forecasting Model', 'Startup Budget & Feasibility Analysis', 'Document Flow & Auditing Optimization Project']
      };
      const chips = quickProj[curField] || (isAr ? ['مشروع تخرج / بحث تطبيقي مميز', 'مبادرة تحسين الأداء وتطوير العمليات', 'مشروع عملي أو دراسة حالة واقعية'] : ['Graduation Applied Research Project', 'Process Optimization Initiative', 'Real-world Case Study Project']);
      return `
        <div style="margin-top:20px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-${isAr ? 'right' : 'left'}:4px solid #10b981;border-radius:12px;font-size:13px;line-height:1.7;color:#334155;text-align:${isAr ? 'right' : 'left'};">
          <div style="font-weight:800;color:#0f172a;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <span class="wz-tip-mark">i</span> <span>${isAr ? 'تلميح: المشاريع العملية هي إثباتك الأقوى!' : 'Pro Tip: Projects prove your practical value!'}</span>
          </div>
          <div style="color:#475569;margin-bottom:10px;">${isAr ? `في مجال <strong>${fName}</strong>، أصحاب العمل يهتمون جداً برؤية مشاريعك وتطبيقاتك الحية. اذكر اسم المشروع أو المبادرة التي شاركت بها.` : `In <strong>${fName}</strong>, employers love seeing practical output. List the name of your key project or initiative.`}</div>
          <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px;">${isAr ? 'اختر مثالاً كبداية ثم اكتب تفاصيل مشروعك الحقيقية:' : 'Choose a starter, then add your real project details:'}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            ${chips.map(ch => `<button type="button" onclick="Wizard.fillStepInput('wz-input-proj', '${h(ch)}', 'projects')" style="padding:6px 12px;background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;font-weight:600;color:#10b981;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#ecfdf5'" onmouseout="this.style.background='#fff'">+ ${h(ch)}</button>`).join('')}
          </div>
        </div>
      `;
    }

    if (step === 'education') {
      const chips = isAr ? ['بكالوريوس تجارة / إدارة أعمال - جامعة...', 'بكالوريوس علوم حاسب / هندسة برمجيات - جامعة...', 'بكالوريوس تربية / آداب - جامعة...', 'دبلومة متخصصة / شهادة مهنية عالية'] : ['Bachelor of Business Administration — University of...', 'Bachelor of Computer Science / Engineering', 'Bachelor of Education / Arts', 'Professional Diploma / Certified Specialist'];
      return `
        <div style="margin-top:20px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:13px;color:#475569;text-align:${isAr ? 'right' : 'left'};">
          <div style="font-weight:700;color:#0f172a;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
            <span class="wz-tip-mark">i</span> <span>${isAr ? 'تلميح سريع لكتابة المؤهل:' : 'Quick tip for Education:'}</span>
          </div>
          <div>${isAr ? 'اذكر أعلى مؤهل دراسي حصلت عليه مع اسم الجامعة أو المعهد وسنة التخرج.' : 'List your highest qualification along with university and graduation year.'}</div>
          <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;">
            ${chips.map(ch => `<button type="button" onclick="Wizard.fillStepInput('wz-input-edu-degree', '${h(ch)}', 'education')" style="padding:4px 10px;background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;color:#475569;cursor:pointer;">+ ${h(ch)}</button>`).join('')}
          </div>
        </div>
      `;
    }

    return '';
  }

  function skipExperienceFresh() {
    career.experience = [];
    if (!career.careerProfile) career.careerProfile = {};
    career.careerProfile.years = '0';
    handleNext();
  }

  function shouldAskForProjects() {
    if (typeof AICoach !== 'undefined' && typeof AICoach.roleCoachProfile === 'function') {
      const profile = AICoach.roleCoachProfile(career);
      return (profile?.projectMode || 'hidden') !== 'hidden';
    }
    return PROJECT_FIELDS.includes(career.careerProfile?.field || '');
  }

  function shouldSkipStep(step) {
    if (step === 'experience_years' && career.meta?.quickStartSenior) return true;
    if (step === 'projects') return !shouldAskForProjects();
    return false;
  }

  function setTemplate(tId) {
    if (!career.meta) career.meta = {};
    career.meta.templateId = tId;
    updatePreview();
  }



  function getWizardSkills() {
    return [...new Set(Object.values(career.skills || {}).flat().map(value => String(value || '').trim()).filter(Boolean))];
  }

  function setWizardSkills(values) {
    const clean = [...new Set((values || []).map(value => String(value || '').trim()).filter(Boolean))];
    career.skills = clean.length ? { [career.meta?.locale === 'ar' ? 'المهارات الأساسية' : 'Core Skills']: clean } : {};
    saveAndPreview();
    return clean;
  }

  function renderSelectedSkills() {
    const root = el('wz-selected-skills');
    if (!root) return;
    const values = getWizardSkills();
    root.innerHTML = values.map(skill => `<span class="wz-selected-skill">${h(skill)}<button type="button" aria-label="حذف ${a(skill)}" onclick="Wizard.removeWizardSkill('${a(skill)}')">×</button></span>`).join('');
  }

  function addCustomSkill() {
    const input = el('wz-input-skills');
    const value = input?.value?.trim() || '';
    if (!value) return;
    const additions = value.split(/[,،]/).map(x => x.trim()).filter(Boolean);
    setWizardSkills([...getWizardSkills(), ...additions]);
    if (input) input.value = '';
    renderSelectedSkills();
    document.querySelectorAll('.wz-skill-chip input').forEach(box => {
      box.checked = getWizardSkills().some(x => x.toLowerCase() === box.value.toLowerCase());
    });
  }

  function toggleWizardSkill(skill, checked) {
    const values = getWizardSkills();
    const next = checked ? [...values, skill] : values.filter(x => x.toLowerCase() !== String(skill).toLowerCase());
    setWizardSkills(next);
    renderSelectedSkills();
  }

  function removeWizardSkill(skill) {
    setWizardSkills(getWizardSkills().filter(x => x.toLowerCase() !== String(skill).toLowerCase()));
    renderSelectedSkills();
    document.querySelectorAll('.wz-skill-chip input').forEach(box => {
      if (box.value.toLowerCase() === String(skill).toLowerCase()) box.checked = false;
    });
  }

  function buildSummaryDraft() {
    const isAr = career.meta?.locale === 'ar';
    const title = career.personalInfo?.title || career.careerProfile?.title || (isAr ? 'متخصص' : 'Professional');
    const years = career.careerProfile?.years || '';
    const focus = el('wz-summary-focus')?.value?.trim() || '';
    const tools = el('wz-summary-tools')?.value?.trim() || '';
    const value = el('wz-summary-value')?.value?.trim() || '';
    if (!focus) {
      showError(isAr ? 'اكتب أهم مجالات أو مهام عملت بها أولًا.' : 'Add your main areas or responsibilities first.');
      return;
    }
    const yearText = years && years !== '0' ? (isAr ? ` بخبرة ${years} سنوات` : ` with ${years} years of experience`) : '';
    const draft = isAr
      ? `${title}${yearText} في ${focus}. ${tools ? `أستخدم ${tools} لدعم تنفيذ المهام وتنظيم العمل.` : ''} ${value ? `أركز على ${value} لتقديم عمل واضح وموثوق.` : ''}`.replace(/\s+/g,' ').trim()
      : `${title}${yearText} across ${focus}. ${tools ? `I use ${tools} to support delivery and organize the work.` : ''} ${value ? `I focus on ${value} to produce clear and reliable outcomes.` : ''}`.replace(/\s+/g,' ').trim();
    const box = el('wz-input-summary');
    if (!box) return;
    if (box.value.trim() && !confirm(isAr ? 'استبدال النبذة الحالية بالمسودة الجديدة؟' : 'Replace the current summary with this draft?')) return;
    box.value = draft;
    box.dispatchEvent(new Event('input', { bubbles: true }));
    box.focus();
  }

  function experienceSuggestionList() {
    const ar = career.meta?.locale === 'ar';
    const field = career.careerProfile?.field || 'other';
    const maps = {
      accountant: ar ? ['إعداد ومراجعة القيود اليومية والتأكد من اكتمال المستندات المؤيدة.', 'تنفيذ التسويات البنكية ومتابعة الفروقات حتى إغلاقها.', 'المساهمة في إعداد التقارير المالية الدورية وتجهيز ملفات المراجعة.', 'متابعة الفواتير والمصروفات وتحديث السجلات باستخدام Excel أو نظام الشركة.'] : ['Prepared and reviewed journal entries with supporting documents.', 'Completed bank reconciliations and followed up on outstanding differences.', 'Supported periodic financial reporting and audit-file preparation.', 'Tracked invoices and expenses using Excel or the company system.'],
      developer: ar ? ['تطوير واجهات أو خدمات برمجية وفق متطلبات المنتج والمعايير المتفق عليها.', 'تحسين تنظيم الكود وإعادة استخدام المكونات لتسهيل الصيانة.', 'اختبار الميزات ومعالجة الأخطاء بالتعاون مع الفريق قبل الإطلاق.', 'توثيق التغييرات التقنية والمساهمة في مراجعات الكود.'] : ['Built product features against agreed requirements and standards.', 'Improved code organization and reusable components for maintainability.', 'Tested features and resolved defects with the team before release.', 'Documented changes and contributed to code reviews.'],
      teacher: ar ? ['إعداد خطط دروس تتناسب مع أهداف المنهج ومستوى الطلاب.', 'متابعة تقدم الطلاب باستخدام أنشطة وتقييمات دورية.', 'تطبيق أساليب تعلم تفاعلية لدعم المشاركة والفهم.', 'التواصل مع الإدارة وأولياء الأمور بشأن تقدم الطلاب واحتياجاتهم.'] : ['Prepared lesson plans aligned with curriculum goals and student level.', 'Tracked progress through activities and periodic assessments.', 'Applied interactive methods to support participation and understanding.', 'Communicated with school staff and parents about student progress.'],
      doctor: ar ? ['تقييم الحالات وتوثيق التاريخ المرضي والفحص السريري تحت البروتوكولات المعتمدة.', 'متابعة خطط العلاج ونتائج الفحوصات والتنسيق مع الفريق الطبي.', 'تثقيف المرضى حول التعليمات العلاجية والمتابعة.', 'الالتزام بإجراءات سلامة المرضى ومكافحة العدوى.'] : ['Assessed patients and documented histories and examinations under approved protocols.', 'Followed treatment plans and investigations with the clinical team.', 'Educated patients on treatment instructions and follow-up.', 'Complied with patient-safety and infection-control procedures.'],
      hr: ar ? ['تنسيق عمليات التوظيف من فرز السير حتى ترتيب المقابلات والمتابعة.', 'تحديث ملفات الموظفين وبيانات الحضور والإجازات وفق الإجراءات.', 'دعم إجراءات التعيين والتهيئة للموظفين الجدد.', 'إعداد تقارير دورية عن التوظيف أو شؤون العاملين.'] : ['Coordinated recruitment from CV screening through interviews and follow-up.', 'Maintained employee files, attendance, and leave records.', 'Supported hiring and onboarding procedures for new employees.', 'Prepared periodic recruitment or employee-relations reports.']
    };
    return maps[field] || (ar ? ['تنظيم المهام اليومية ومتابعة تنفيذها وفق الأولويات.', 'التنسيق مع الفريق أو العملاء لضمان وضوح المتطلبات والتسليم.', 'إعداد أو تحديث السجلات والتقارير المرتبطة بالعمل.', 'المساهمة في تحسين جودة التنفيذ ومعالجة المشكلات المتكررة.'] : ['Organized daily work and followed up according to priorities.', 'Coordinated with colleagues or clients to clarify requirements and delivery.', 'Prepared or updated work-related records and reports.', 'Contributed to quality improvements and recurring issue resolution.']);
  }

  function showExperienceSuggestions() {
    const root = el('wz-experience-suggestions');
    if (!root) return;
    const ar = career.meta?.locale === 'ar';
    const items = experienceSuggestionList();
    root.style.display = 'block';
    root.innerHTML = `<div class="wz-ai-coach" style="margin-top:12px"><div class="wz-ai-coach-title">${ar ? 'اختر فقط النقاط التي تصف عملك فعلًا' : 'Choose only bullets that reflect your real work'}</div><div class="wz-skill-suggestions">${items.map((text,index)=>`<button type="button" class="wz-skill-chip" style="border:0;background:transparent;padding:0;text-align:start" onclick="Wizard.addExperienceBullet(${index})"><span>${h(text)}</span></button>`).join('')}</div></div>`;
  }

  function addExperienceBullet(index) {
    const text = experienceSuggestionList()[index];
    const box = el('wz-input-exp-desc');
    if (!text || !box) return;
    const existing = box.value.split(/\n+/).map(x => x.trim()).filter(Boolean);
    if (!existing.some(x => x.toLowerCase() === text.toLowerCase())) existing.push(text);
    box.value = existing.join('\n');
    box.dispatchEvent(new Event('input', { bubbles: true }));
  }

  function wizardTemplatePreview(id) {
    const cls = id === 'modern' ? 'wz-template-modern' : id === 'executive' ? 'wz-template-executive' : 'wz-template-ats';
    const accent = id === 'modern' ? '#0f766e' : id === 'executive' ? '#172554' : '#2563eb';
    const sections = [1,2,3].map(() => '<div class="mini-section"><div class="mini-heading"></div><div class="mini-line"></div><div class="mini-line"></div><div class="mini-line short"></div></div>').join('');
    return `<div class="wz-template-mini ${cls}" style="--mini-accent:${accent}"><div class="mini-name"></div><div class="mini-title"></div><div class="mini-contact"></div>${sections}</div>`;
  }

  function getWizardSkillSuggestions(field, isAr) {
    const map = {
      accountant: isAr ? ['Excel', 'إعداد التقارير المالية', 'القيود اليومية', 'التسويات البنكية', 'الضرائب', 'ERP', 'IFRS', 'المراجعة الداخلية', 'تحليل مالي', 'إدارة الفواتير'] : ['Excel', 'Financial Reporting', 'Journal Entries', 'Bank Reconciliation', 'Tax', 'ERP', 'IFRS', 'Internal Audit', 'Financial Analysis', 'Invoices'],
      developer: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Git', 'SQL', 'REST APIs', 'Testing', 'Problem Solving', 'UI Performance'],
      teacher: isAr ? ['إدارة الفصل', 'تخطيط الدروس', 'تقييم الطلاب', 'التعلم التفاعلي', 'التواصل مع أولياء الأمور', 'تكنولوجيا التعليم'] : ['Classroom Management', 'Lesson Planning', 'Student Assessment', 'Interactive Learning', 'Parent Communication', 'EdTech'],
      doctor: isAr ? ['رعاية المرضى', 'التشخيص السريري', 'السجلات الطبية', 'مكافحة العدوى', 'التواصل الطبي', 'الطوارئ'] : ['Patient Care', 'Clinical Diagnosis', 'Medical Records', 'Infection Control', 'Medical Communication', 'Emergency Care'],
      hr: isAr ? ['التوظيف', 'المقابلات', 'Onboarding', 'شؤون العاملين', 'Payroll', 'HRIS'] : ['Recruitment', 'Interviewing', 'Onboarding', 'Employee Relations', 'Payroll', 'HRIS'],
      sales: isAr ? ['إدارة العملاء', 'التفاوض', 'CRM', 'المبيعات الميدانية', 'تحقيق المستهدفات', 'خدمة ما بعد البيع'] : ['Client Management', 'Negotiation', 'CRM', 'Field Sales', 'Targets', 'After-sales Support']
    };
    return map[field] || (isAr ? ['التواصل', 'تنظيم الوقت', 'حل المشكلات', 'العمل الجماعي', 'Microsoft Office', 'خدمة العملاء'] : ['Communication', 'Time Management', 'Problem Solving', 'Teamwork', 'Microsoft Office', 'Customer Service']);
  }

  function insertExperienceBullets() { showExperienceSuggestions(); }

  return { init, setLang, setField, setLevel, setTemplate, skipExperienceFresh, fillStepInput, insertExperienceBullets, buildSummaryDraft, addCustomSkill, toggleWizardSkill, removeWizardSkill, showExperienceSuggestions, addExperienceBullet, prevStep: handlePrev };
})();

document.addEventListener('DOMContentLoaded', () => {
  if (typeof I18n !== 'undefined' && typeof Wizard !== 'undefined') {
    Wizard.init();
  }
});
