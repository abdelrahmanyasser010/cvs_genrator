/**
 * CV Studio — Premium Editor v3
 * Canva/Figma-inspired editor with live preview, section panels, undo/redo, and autosave.
 */
const Editor = (function () {
  let career = null;
  let previewTimeout = null;
  let currentZoom = 100;
  let undoStack = [];
  let redoStack = [];
  let currentEditSection = null;
  let autosaveTimer = null;
  let isAILoading = false;
  const LINK_PROOF_FIELDS = ['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'marketing', 'data_analyst', 'architect'];
  const GITHUB_FIELDS = ['developer', 'data_analyst'];
  const DATA_BANNER_KEY = 'cv_studio_data_banner_dismissed';
  const PROJECT_FIELDS = ['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'marketing', 'data_analyst', 'project_manager', 'business_analyst', 'architect', 'civil_engineer', 'mechanical_engineer', 'electrical_engineer'];

  const el = id => document.getElementById(id);
  const t = (key, fb) => (typeof I18n !== 'undefined' ? I18n.t(key, fb) : fb || key);
  const h = value => (typeof Safety !== 'undefined' ? Safety.escapeHtml(value) : String(value || ''));
  const a = value => (typeof Safety !== 'undefined' ? Safety.escapeAttr(value) : String(value || '').replace(/"/g, '&quot;'));
  const isAr = () => (career?.meta?.locale || I18n?.getLocale?.()) === 'ar';
  const coachName = () => isAr() ? 'المساعد الذكي (AI Advisor)' : 'AI Advisor & Optimizer';
  const keywordCardId = keyword => 'kw-card-' + encodeURIComponent(String(keyword || '')).replace(/%/g, '_');

  function buildCvSearchText(careerObj = career) {
    const c = careerObj || {};
    const p = c.personalInfo || {};
    return [
      p.title || '',
      c.professionalSummary || '',
      ...(c.experience || []).flatMap(item => [item.role, item.company, item.rawDescription, ...(item.bullets || [])]),
      ...(c.education || []).flatMap(item => [item.degree, item.school, item.field, item.details]),
      ...Object.values(c.skills || {}).flat(),
      ...(c.projects || []).flatMap(item => [item.name, item.desc, item.tech, ...(item.bullets || [])]),
      ...(c.certificates || []).flatMap(item => [item.name, item.issuer]),
      ...(c.languages || []).flatMap(item => [item.lang, item.level])
    ].filter(Boolean).join(' ').toLowerCase();
  }

  function extractJDKeywords(text) {
    const stopWords = new Set(['with','and','for','from','that','this','have','will','your','when','where','what','which','who','into','using','required','preferred','responsibilities','requirements','years','year','إلى','على','في','من','عن','مع','هذا','هذه','تلك','التي','الذي','كل','خبرة','سنوات','مطلوب','المتطلبات','المسؤوليات']);
    const clean = String(text || '').toLowerCase().replace(/[^a-z0-9أ-ي+#.\s-]/g, ' ');
    const words = clean.split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));
    const counts = new Map();
    words.forEach(word => counts.set(word, (counts.get(word) || 0) + 1));
    return Array.from(counts.entries()).sort((a,b) => b[1] - a[1]).map(([word]) => word).slice(0, 40);
  }

  function containsDemoData(careerObj = career) {
    const text = buildCvSearchText(careerObj);
    return /leading organization|accredited university|professional development program|senior specialist \/ leader|example company|شركة رائدة|جامعة معتمدة|بيانات تجريبية/.test(text);
  }

  function debounce(func, wait) {
    return function (...args) {
      clearTimeout(previewTimeout);
      previewTimeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  // ─────────────────────────────────────────────────
  // INIT
  // ─────────────────────────────────────────────────
  async function init() {
    career = CareerStorage.load();
    if (!career) { window.location.href = 'index.html'; return; }

    career.meta = career.meta || {};
    career.meta.collapsedGroups = career.meta.collapsedGroups || [];
    
    await I18n.init(career.meta?.locale);
    if (career.meta?.locale) await I18n.setLocale(career.meta.locale);
    if (typeof I18n.translateDom === 'function') I18n.translateDom();
    ensureJobTitle();

    // Fetch Career Rules Engine
    const field = career.careerProfile?.field || 'other';
    const lang = career.meta?.locale || 'en';
    try {
      const resp = await fetch(`/knowledge-base/${lang}/${field}/rules.json`);
      if (resp.ok) {
        career.meta.rules = await resp.json();
      } else {
        // Fallback to english if arabic rules not found (or vice versa), though we generated both
        const fbResp = await fetch(`/knowledge-base/en/${field}/rules.json`);
        if (fbResp.ok) career.meta.rules = await fbResp.json();
      }
    } catch (e) {
      console.warn('Failed to load career rules engine', e);
    }

    pushUndo();
    resolveStyles();
    bindEvents();
    
    // Apply persisted zoom
    if (career.meta.zoomLevel) {
      const zoomSel = el('zoom-select');
      if (zoomSel) zoomSel.value = career.meta.zoomLevel;
      handleZoomSelect(career.meta.zoomLevel);
    }
    
    renderAll();
    updateTopbarName();
    updateDataSafetyBanner();
    if (window.innerWidth > 1024 && window.innerWidth < 1280) document.body.classList.add('coach-collapsed');

    // Mobile & Tablet init & resize handler
    const handleResize = () => {
      const isMobile = window.matchMedia('(max-width: 1024px)').matches;
      if (!isMobile) {
        document.body.classList.remove('mobile-edit-mode', 'mobile-preview-mode', 'mobile-coach-mode');
        if (window.innerWidth < 1280 && !document.body.dataset.coachPreference) document.body.classList.add('coach-collapsed');
        if (window.innerWidth >= 1280 && !document.body.dataset.coachPreference) document.body.classList.remove('coach-collapsed');
        const paper = el('a4-wrapper');
        if (paper) {
          paper.style.transform = 'none';
          paper.style.marginBottom = '0px';
          paper.style.width = '100%';
        }
      } else {
        if (!document.body.classList.contains('mobile-preview-mode') && !document.body.classList.contains('mobile-coach-mode')) {
          document.body.classList.add('mobile-edit-mode');
        }
        if (currentMobileView === 'preview') applyMobileScale();
        updateMobScoreBar();
      }
    };
    
    handleResize(); // Initial call
    window.addEventListener('resize', handleResize);
  }

  function resolveStyles() {
    ContentPicker.getProfile(career).then(profile => {
      career.meta._resolvedTemplate = TemplateSelector.resolveRecommendedTemplate(career, profile);
      if (!career.meta.templateId) career.meta.templateId = 'ai-recommended';
      renderTemplatePicker();
      applyStylesheets();
    });
  }

  function applyStylesheets() {
    const templateId = TemplateSelector.getEffectiveTemplateId(career);
    const template = TemplateSelector.getTemplates().find(tmpl => tmpl.id === templateId);
    const layoutId = template?.layoutId || 'classic';
    const themeId = template?.themeId || 'ats';

    ['layout-base-css', 'layout-css', 'theme-css'].forEach(id => {
      if (!document.getElementById(id)) {
        const link = document.createElement('link');
        link.id = id; link.rel = 'stylesheet';
        document.head.appendChild(link);
      }
    });
    document.getElementById('layout-base-css').href = '/templates/shared/base.css';
    document.getElementById('layout-css').href = TemplateSelector.getLayoutCssPath();
    document.getElementById('layout-css').onload = () => {
      if(career.meta.zoomLevel) handleZoomSelect(career.meta.zoomLevel);
    };
    document.getElementById('theme-css').href = TemplateSelector.getThemeCssPath(themeId);
  }

  function updateDataSafetyBanner(force = false) {
    const topStatus = el('topbar-data-status');
    if (topStatus) topStatus.style.display = 'none';
    const banner = el('local-data-banner');
    if (banner) banner.hidden = true;
  }

  function dismissDataBanner() {
    localStorage.setItem(DATA_BANNER_KEY, 'true');
    const banner = el('local-data-banner');
    if (banner) banner.hidden = true;
  }

  function exportBackup() {
    try {
      const done = CareerStorage.downloadBackup();
      if (done) {
        localStorage.removeItem(DATA_BANNER_KEY);
        updateDataSafetyBanner();
        showNoticeModal({
          title: isAr() ? 'تم تنزيل النسخة الاحتياطية' : 'Backup downloaded',
          body: isAr() ? 'احتفظ بالملف في مكان آمن. يحتوي على كل السير والنسخ المحفوظة في هذا المتصفح.' : 'Keep the file somewhere safe. It includes all resumes and versions saved in this browser.'
        });
      }
    } catch (error) {
      showNoticeModal({ title: isAr() ? 'تعذر إنشاء النسخة الاحتياطية' : 'Backup failed', body: error?.message || '' });
    }
  }

  function toggleCoachPanel() {
    if (window.matchMedia('(max-width: 1024px)').matches) {
      setMobileView('coach');
      return;
    }
    document.body.classList.toggle('coach-collapsed');
    document.body.dataset.coachPreference = document.body.classList.contains('coach-collapsed') ? 'closed' : 'open';
    const button = el('coach-toggle-btn');
    if (button) button.classList.toggle('active', !document.body.classList.contains('coach-collapsed'));
  }

  // ─────────────────────────────────────────────────
  // EVENTS
  // ─────────────────────────────────────────────────
  function bindEvents() {
    // Import
    el('import-file')?.addEventListener('change', e => {
      const file = e.target.files[0]; if (!file) return;
      const reader = new FileReader();
      reader.onload = ev => {
        try {
          career = CareerStorage.importJson(ev.target.result);
          if (career.meta?.locale) I18n.setLocale(career.meta.locale);
          renderAll();
          closeExportModal();
          showSaveIndicator(t('ed.imported', 'Imported ?'), true);
        } catch (error) {
          alert(t('ed.import_failed', 'Could not import this JSON file.'));
        }
      };
      reader.readAsText(file);
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', e => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); undoAction(); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); redoAction(); }
    });

    // Search sections
    el('sections-search')?.addEventListener('input', e => filterSections(e.target.value));
    
    // Placeholder translation
    const searchEl = el('sections-search');
    if(searchEl) searchEl.placeholder = t('ed.search', 'Search sections...');
  }

  // ─────────────────────────────────────────────────
  // RENDER ALL
  // ─────────────────────────────────────────────────
  function updateScoreHeader() {
    if (typeof AICoach === 'undefined') return;
    const header = el('resume-score-header');
    if (!header) return;
    const review = AICoach.getPreExportReview(career);
    const isAr = career.meta?.locale === 'ar' || document.documentElement.lang === 'ar';
    let color = '#22c55e';
    if (review.score < 60) color = '#ef4444';
    else if (review.score < 80) color = '#f59e0b';
    
    header.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
        <span style="font-size: 13px; font-weight: 800; color: #1e293b;">${isAr ? 'قوة السيرة الذاتية' : 'Resume Strength'}</span>
        <span style="font-size: 16px; font-weight: 800; color: ${color};">${review.score}%</span>
      </div>
      <div style="height: 6px; background: #e2e8f0; border-radius: 3px; overflow: hidden;">
        <div style="height: 100%; width: ${review.score}%; background: ${color}; border-radius: 3px; transition: width 0.3s;"></div>
      </div>
    `;
  }

  function renderAll() {
    renderSectionsList();
    updateScoreHeader();
    const _ins = typeof AICoach !== 'undefined' ? AICoach.buildCoachInsights(career) : null;
    if (_ins) { renderCoachOverview(_ins); renderCoachMentor(_ins); renderCoachATS(_ins); }
    renderTemplatePicker();
    renderPreview();
    applyStylesheets();
    if(typeof I18n.translateDom === 'function') I18n.translateDom();
  }

  function updateTopbarName() {
    const nameEl = el('topbar-name');
    const displayTitle = career.meta?.versionName || resumeDisplayTitle();
    if (nameEl) nameEl.textContent = displayTitle;
    const mobName = el('mob-topbar-name');
    if (mobName) mobName.textContent = displayTitle;
    const badge = el('active-version-badge');
    if (badge) {
      const activeId = typeof CareerStorage !== 'undefined' && CareerStorage.getActiveVersionId ? CareerStorage.getActiveVersionId() : 'default';
      badge.hidden = activeId === 'default';
      badge.textContent = activeId === 'default' ? '' : (career.meta?.versionName || (isAr() ? 'نسخة مخصصة' : 'Tailored copy'));
    }
  }

  function resumeDisplayTitle() {
    const name = career.personalInfo?.name?.trim();
    if (!name) return t('ed.myResume', isAr() ? 'سيرتي الذاتية' : 'My Resume');
    return t('ed.resumeFor', isAr() ? `سيرة ${name}` : `${name}'s Resume`).replace('{name}', name);
  }

  function fallbackJobTitle() {
    const field = career?.careerProfile?.field || '';
    const map = {
      developer: ['Software Developer', 'مطور برمجيات'],
      designer: ['Graphic Designer', 'مصمم جرافيك'],
      graphic_designer: ['Graphic Designer', 'مصمم جرافيك'],
      ui_ux_designer: ['UI/UX Designer', 'مصمم تجربة مستخدم'],
      doctor: ['Doctor', 'طبيب'],
      nurse: ['Nurse', 'ممرض'],
      pharmacist: ['Pharmacist', 'صيدلي'],
      accountant: ['Accountant', 'محاسب'],
      teacher: ['Teacher', 'مدرس'],
      engineer: ['Engineer', 'مهندس'],
      hr: ['HR Specialist', 'أخصائي موارد بشرية'],
      marketing: ['Marketing Specialist', 'أخصائي تسويق'],
      lawyer: ['Lawyer', 'محامي']
    };
    const pair = map[field];
    return pair ? pair[isAr() ? 1 : 0] : '';
  }

  function ensureJobTitle() {
    // Keep the target title user-authored. Generic profession names are placeholders only.
    career.personalInfo = career.personalInfo || {};
  }

  function currentField() {
    return career?.careerProfile?.field || '';
  }

  function getPh() {
    const field = currentField() || 'developer';
    const lang = isAr() ? 'ar' : 'en';
    return window.getProfessionPlaceholders ? window.getProfessionPlaceholders(field, lang) : {};
  }

  function needsLinkProof() {
    return LINK_PROOF_FIELDS.includes(currentField());
  }

  function isGithubField() {
    return GITHUB_FIELDS.includes(currentField());
  }

  function shouldShowSection(key) {
    if (key !== 'projects') return true;
    if ((career.projects || []).length > 0) return true;
    const rules = career.meta?.rules || {};
    if ((rules.required_sections || []).includes('projects') || (rules.recommended_sections || []).includes('projects')) return true;
    if (typeof AICoach !== 'undefined' && typeof AICoach.roleCoachProfile === 'function') {
      const profile = AICoach.roleCoachProfile(career);
      return (profile?.projectMode || 'hidden') !== 'hidden';
    }
    return PROJECT_FIELDS.includes(currentField());
  }

  function showDecisionModal({ title, body, confirmText, cancelText, tone = 'ai', hideCancel = false }) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay ai-decision-overlay';
      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div class="ai-decision-box ${tone}">
          <div class="ai-decision-kicker">${h(coachName())}</div>
          <h3>${h(title || (isAr() ? 'اقتراح جاهز' : 'Suggestion ready'))}</h3>
          <div class="ai-decision-body">${h(body || '').replace(/\n/g, '<br>')}</div>
          <div class="ai-decision-actions">
            ${hideCancel ? '' : `<button class="btn btn-ghost" data-action="cancel">${h(cancelText || (isAr() ? 'سيبها زي ما هي' : 'Keep current'))}</button>`}
            <button class="btn btn-primary" data-action="apply">${h(confirmText || (isAr() ? 'طبق الاقتراح' : 'Apply suggestion'))}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const done = value => { overlay.remove(); resolve(value); };
      overlay.addEventListener('click', event => {
        if (event.target === overlay) done(false);
        const action = event.target?.dataset?.action;
        if (action === 'apply') done(true);
        if (action === 'cancel') done(false);
      });
    });
  }

  function showNoticeModal({ title, body, confirmText }) {
    return showDecisionModal({
      title,
      body,
      confirmText: confirmText || (isAr() ? 'تمام' : 'Got it'),
      hideCancel: true,
      tone: 'notice'
    });
  }

  function showInputModal({ title, body, placeholder, confirmText, cancelText }) {
    return new Promise(resolve => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay ai-decision-overlay';
      overlay.style.display = 'flex';
      overlay.innerHTML = `
        <div class="ai-decision-box ai">
          <div class="ai-decision-kicker">${h(coachName())}</div>
          <h3>${h(title)}</h3>
          <div class="ai-decision-body">${h(body || '').replace(/\n/g, '<br>')}</div>
          <textarea class="form-textarea" id="modal-input-ta" rows="6" placeholder="${h(placeholder || '')}" style="margin:12px 0;width:100%;font-family:inherit;"></textarea>
          <div class="ai-decision-actions">
            <button class="btn btn-ghost" data-action="cancel">${h(cancelText || (isAr() ? 'إلغاء' : 'Cancel'))}</button>
            <button class="btn btn-primary" data-action="apply">${h(confirmText || (isAr() ? 'تحليل الآن' : 'Analyze'))}</button>
          </div>
        </div>`;
      document.body.appendChild(overlay);
      const done = value => {
        const text = overlay.querySelector('#modal-input-ta')?.value || null;
        overlay.remove();
        resolve(value ? text : null);
      };
      overlay.addEventListener('click', event => {
        if (event.target === overlay) done(false);
        const action = event.target?.dataset?.action;
        if (action === 'apply') done(true);
        if (action === 'cancel') done(false);
      });
    });
  }

  function showAIError(error) {
    return showNoticeModal({
      title: error?.status === 429 ? (isAr() ? 'وصلت لحد الاستخدام المؤقت' : 'Temporary AI limit reached') : (isAr() ? 'تعذر تشغيل المساعد الآن' : 'AI is unavailable right now'),
      body: error?.message || (isAr() ? 'جرب مرة أخرى بعد لحظة، أو أكمل باستخدام الاقتراحات المحلية.' : 'Try again shortly, or continue with offline suggestions.'),
      confirmText: isAr() ? 'تمام، هجرب تاني' : 'Try again'
    });
  }

  // ─────────────────────────────────────────────────
  // SECTIONS LIST
  // ─────────────────────────────────────────────────
  const SECTION_ICONS = {
    personalInfo: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="8" r="3.5"/><path d="M5 21a7 7 0 0 1 14 0"/></svg>',
    summary: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>',
    experience: '<svg class="icon-svg" viewBox="0 0 24 24"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V5h8v2M3 12h18M10 12v2h4v-2"/></svg>',
    projects: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 3 4 7v10l8 4 8-4V7z"/><path d="m4 7 8 4 8-4M12 11v10"/></svg>',
    skills: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><circle cx="12" cy="12" r="5"/></svg>',
    education: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="m3 10 9-5 9 5-9 5z"/><path d="M7 12v5c3 2 7 2 10 0v-5M21 10v6"/></svg>',
    languages: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>',
    certificates: '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M6 3h12v13H6z"/><path d="M9 7h6M9 10h6M9 13h3M9 16v5l3-2 3 2v-5"/></svg>',
    awards: '<svg class="icon-svg" viewBox="0 0 24 24"><circle cx="12" cy="9" r="5"/><path d="m9 13-2 8 5-3 5 3-2-8"/></svg>'
  };

  const SECTION_DEFS = [
    { key: 'personalInfo', icon: SECTION_ICONS.personalInfo, labelKey: 'ed.sections.personalInfo', defaultLabel: 'Personal Information', group: 'basics' },
    { key: 'summary', icon: SECTION_ICONS.summary, labelKey: 'ed.sections.summary', defaultLabel: 'Professional Summary', group: 'basics' },
    { key: 'experience', icon: SECTION_ICONS.experience, labelKey: 'ed.sections.experience', defaultLabel: 'Work Experience', group: 'basics' },
    { key: 'projects', icon: SECTION_ICONS.projects, labelKey: 'ed.sections.projects', defaultLabel: 'Projects', group: 'basics' },
    { key: 'skills', icon: SECTION_ICONS.skills, labelKey: 'ed.sections.skills', defaultLabel: 'Skills', group: 'basics' },
    { key: 'education', icon: SECTION_ICONS.education, labelKey: 'ed.sections.education', defaultLabel: 'Education', group: 'extras' },
    { key: 'languages', icon: SECTION_ICONS.languages, labelKey: 'ed.sections.languages', defaultLabel: 'Languages', group: 'extras' },
    { key: 'certificates', icon: SECTION_ICONS.certificates, labelKey: 'ed.sections.certificates', defaultLabel: 'Certifications', group: 'extras' },
    { key: 'awards', icon: SECTION_ICONS.awards, labelKey: 'ed.sections.awards', defaultLabel: 'Awards', group: 'extras' }
  ];

  function getSectionDefs() {
    const customIcon = '<svg class="icon-svg" viewBox="0 0 24 24"><path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/></svg>';
    const customs = (career?.customSections || []).map(section => ({
      key: `custom:${section.id}`,
      icon: customIcon,
      labelKey: '',
      defaultLabel: section.title || (isAr() ? 'قسم مخصص' : 'Custom section'),
      group: 'extras',
      custom: true
    }));
    return SECTION_DEFS.concat(customs);
  }

  function getCustomSection(key) {
    if (!String(key || '').startsWith('custom:')) return null;
    const id = String(key).slice(7);
    return (career.customSections || []).find(section => String(section.id) === id) || null;
  }

  function wordCount(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function getSectionStatus(key) {
    const custom = getCustomSection(key);
    if (custom) {
      const lines = String(custom.content || '').split(/\n+/).filter(line => line.trim());
      return custom.title && lines.length ? 'done' : 'warn';
    }
    const issue = getSectionIssue(key);
    if (issue?.severity === 'high') return 'missing';
    if (issue?.severity === 'medium') return 'warn';
    if (issue?.severity === 'low') return 'tip';
    switch (key) {
      case 'personalInfo': {
        const p = career.personalInfo || {};
        if (p.name && p.email && p.phone && (p.title || career.careerProfile?.title)) return 'done';
        if (p.name || p.email || p.phone || p.title) return 'warn';
        return 'missing';
      }
      case 'summary': {
        const wc = wordCount(career.professionalSummary);
        if (wc >= 35 && wc <= 95) return 'done';
        if (wc > 0) return 'warn';
        return 'missing';
      }
      case 'experience': {
        const exps = (career.experience || []).filter(entry => entry.role || entry.company || entry.period || entry.rawDescription || (entry.bullets || []).length);
        if (!exps.length) return 'missing';
        const valid = exps.every(entry => entry.role && entry.company && (entry.period || career.careerProfile?.level === 'fresh') && ((entry.bullets || []).filter(Boolean).length >= 2 || wordCount(entry.rawDescription) >= 25));
        return valid ? 'done' : 'warn';
      }
      case 'projects': {
        const projects = (career.projects || []).filter(item => item.name || item.desc || item.tech || (item.bullets || []).length);
        if (!projects.length) return 'empty';
        return projects.every(item => item.name && (wordCount(item.desc) >= 8 || (item.bullets || []).filter(Boolean).length >= 2)) ? 'done' : 'warn';
      }
      case 'skills': {
        const count = Object.values(career.skills || {}).flat().filter(Boolean).length;
        if (count >= 5) return 'done';
        if (count > 0) return 'warn';
        return 'missing';
      }
      case 'education': {
        const edus = (career.education || []).filter(item => item.degree || item.school || item.institution || item.year || item.period);
        if (!edus.length) return career.careerProfile?.level === 'fresh' ? 'missing' : 'warn';
        return edus.every(item => item.degree && (item.school || item.institution) && (item.year || item.period)) ? 'done' : 'warn';
      }
      case 'languages': {
        const langs = (career.languages || []).filter(item => typeof item === 'string' ? item.trim() : (item.lang || item.language));
        if (!langs.length) return 'empty';
        return langs.every(item => typeof item === 'string' || item.level) ? 'done' : 'warn';
      }
      case 'certificates': {
        const certs = (career.certificates || []).filter(item => item.name || item.title || item.issuer || item.year);
        if (!certs.length) return 'empty';
        return certs.every(item => item.name && (item.issuer || item.year)) ? 'done' : 'warn';
      }
      case 'awards': {
        const awards = (career.awards || []).filter(item => item.name || item.title || item.issuer || item.year || item.description);
        if (!awards.length) return 'empty';
        return awards.every(item => item.name && (item.issuer || item.year || item.description)) ? 'done' : 'warn';
      }
      default: return 'empty';
    }
  }

  function getSectionIssue(key) {
    if (String(key || '').startsWith('custom:')) return null;
    if (typeof AICoach === 'undefined') return null;
    const review = AICoach.getPreExportReview(career);
    const priority = { high: 3, medium: 2, low: 1 };
    return review.items
      .filter(item => item.section === key)
      .sort((left, right) => (priority[right.severity] || 0) - (priority[left.severity] || 0))[0] || null;
  }

  function getSectionPreview(key) {
    const custom = getCustomSection(key);
    if (custom) return String(custom.content || '').split(/\n+/).filter(Boolean).slice(0, 2).join(' · ');
    const maxLen = 60;
    const trunc = value => value && value.length > maxLen ? value.slice(0, maxLen) + '…' : (value || '');
    switch (key) {
      case 'personalInfo': {
        const p = career.personalInfo || {};
        return [p.title || career.careerProfile?.title, p.location].filter(Boolean).join(' · ');
      }
      case 'summary': return trunc(career.professionalSummary);
      case 'experience': {
        const entries = career.experience || [];
        if (!entries.length) return '';
        const first = entries[0] || {};
        const label = [first.role, first.company].filter(Boolean).join(isAr() ? ' — ' : ' at ');
        return entries.length > 1 ? `${label} · +${entries.length - 1}` : label;
      }
      case 'projects': return (career.projects || []).length ? `${career.projects.length} ${isAr() ? 'مشروع' : 'projects'}` : '';
      case 'skills': {
        const skills = Object.values(career.skills || {}).flat().filter(Boolean);
        return skills.length ? `${skills.length} ${isAr() ? 'مهارة مؤكدة' : 'verified skills'}` : '';
      }
      case 'education': return (career.education || []).length ? `${career.education.length} ${isAr() ? 'مؤهل' : 'entries'}` : '';
      case 'languages': return (career.languages || []).length ? `${career.languages.length} ${isAr() ? 'لغة' : 'languages'}` : '';
      case 'certificates': return (career.certificates || []).length ? `${career.certificates.length} ${isAr() ? 'شهادة أو ترخيص' : 'credentials'}` : '';
      case 'awards': return (career.awards || []).length ? `${career.awards.length} ${isAr() ? 'جائزة' : 'awards'}` : '';
      default: return '';
    }
  }

  function toggleGroup(groupId) {
    const idx = career.meta.collapsedGroups.indexOf(groupId);
    if (idx > -1) career.meta.collapsedGroups.splice(idx, 1);
    else career.meta.collapsedGroups.push(groupId);
    CareerStorage.save(career);
    renderSectionsList();
  }

  function renderSectionsList() {
    const list = el('sections-list');
    if (!list) return;
    const ar = isAr();
    const allDefs = getSectionDefs();
    const statuses = allDefs.map(def => getSectionStatus(def.key));
    const readyCount = statuses.filter(status => status === 'done').length;
    const nextDef = allDefs.find(def => ['missing', 'warn'].includes(getSectionStatus(def.key))) || SECTION_DEFS[0];

    const starterHtml = `
      <div class="editor-start-card compact">
        <div class="editor-start-copy">
          <strong>${ar ? 'خطوتك التالية' : 'Next best step'}</strong>
          <span>${ar ? `${readyCount} من ${allDefs.length} أقسام جاهزة. أكمل الأقسام الأساسية أولاً.` : `${readyCount} of ${allDefs.length} sections are ready. Complete the essentials first.`}</span>
        </div>
        <button type="button" class="editor-guided-btn" onclick="Editor.openEditPanel('${nextDef.key}')">
          ${ar ? `افتح ${h(t(nextDef.labelKey, nextDef.defaultLabel))}` : `Open ${h(t(nextDef.labelKey, nextDef.defaultLabel))}`}
        </button>
      </div>
      <div class="editor-quick-actions">
        <button type="button" class="editor-style-btn" onclick="document.getElementById('style-drawer-modal').style.display='flex'">
          <span>${ar ? 'القالب والتصميم' : 'Template & design'}</span><span aria-hidden="true">›</span>
        </button>
        <button type="button" class="editor-style-btn" onclick="Editor.showAddSectionModal()">
          <span>${ar ? 'إضافة قسم اختياري' : 'Add optional section'}</span><span aria-hidden="true">›</span>
        </button>
      </div>`;

    const colors = [
      { color: '#2563eb', label: ar ? 'أزرق' : 'Blue' },
      { color: '#0f766e', label: ar ? 'أخضر داكن' : 'Teal' },
      { color: '#7c3aed', label: ar ? 'بنفسجي' : 'Purple' },
      { color: '#9f1239', label: ar ? 'عنابي' : 'Burgundy' },
      { color: '#1e293b', label: ar ? 'كحلي' : 'Navy' }
    ];
    const styleHtml = `
      <div class="style-settings-final" dir="${ar ? 'rtl' : 'ltr'}">
        <section class="style-setting-section">
          <div class="style-setting-head"><strong>${ar ? 'قالب السيرة' : 'Resume template'}</strong><span>${ar ? 'اختر الشكل الذي يناسب طبيعة الوظيفة' : 'Choose a layout that fits the role'}</span></div>
          <button type="button" class="style-gallery-open" onclick="Editor.openGallery(); document.getElementById('style-drawer-modal').style.display='none'">${ar ? 'فتح معرض القوالب' : 'Open template gallery'} <span>›</span></button>
        </section>
        <section class="style-setting-section">
          <div class="style-setting-head"><strong>${ar ? 'اللون الأساسي' : 'Accent color'}</strong><span>${ar ? 'لون العناوين والفواصل فقط' : 'Used for headings and dividers'}</span></div>
          <div class="style-color-row">${colors.map(item => `<button type="button" class="style-color-dot ${career.meta.accentColor === item.color ? 'active' : ''}" aria-label="${h(item.label)}" title="${h(item.label)}" style="--dot:${item.color}" onclick="Editor.setAccentColor('${item.color}')"></button>`).join('')}</div>
        </section>
        <section class="style-setting-section">
          <div class="style-setting-head"><strong>${ar ? 'الخط' : 'Font'}</strong><span>${ar ? 'Cairo مناسب للعربي وInter للإنجليزي' : 'Cairo for Arabic, Inter for English'}</span></div>
          <div class="style-font-grid">${['Inter','Cairo','Tajawal','Almarai'].map(font => `<button type="button" class="style-font-btn ${career.meta.fontFamily === font ? 'active' : ''}" style="font-family:'${font}',sans-serif" onclick="Editor.setCvFont('${font}')">${font}</button>`).join('')}</div>
        </section>
        <section class="style-setting-section">
          <div class="style-setting-head"><strong>${ar ? 'ترتيب الأقسام' : 'Section order'}</strong><span>${ar ? 'اختر ما يظهر أولاً حسب مستواك' : 'Choose which section leads'}</span></div>
          <div class="style-order-grid">
            <button type="button" onclick="Editor.setSectionOrder(['summary','experience','education','projects','skills','languages','certificates','awards'])">${ar ? 'الخبرة أولاً' : 'Experience first'}</button>
            <button type="button" onclick="Editor.setSectionOrder(['summary','education','experience','projects','skills','languages','certificates','awards'])">${ar ? 'التعليم أولاً' : 'Education first'}</button>
          </div>
        </section>
        <section class="style-setting-section">
          <div class="style-setting-head"><strong>${ar ? 'الصورة الشخصية' : 'Profile photo'}</strong><span>${ar ? 'اختيارية وقد لا تكون مناسبة لكل سوق' : 'Optional and market-dependent'}</span></div>
          <label class="style-toggle-row"><input type="checkbox" ${career.meta.showPhoto ? 'checked' : ''} onchange="Editor.togglePhoto(this.checked)"><span>${ar ? 'إظهار الصورة عند توفر رابط حقيقي' : 'Show a verified profile photo'}</span></label>
        </section>
      </div>`;

    const groups = [
      { id: 'basics', labelKey: 'ed.groups.basics', defaultLabel: ar ? 'الأقسام الأساسية' : 'Essential sections' },
      { id: 'extras', labelKey: 'ed.groups.extras', defaultLabel: ar ? 'الأقسام الإضافية' : 'Additional sections' }
    ];
    const gs = el('global-settings');
    if (gs) gs.innerHTML = starterHtml;
    const drawerContent = el('style-drawer-content');
    if (drawerContent) drawerContent.innerHTML = styleHtml;

    list.innerHTML = groups.map(group => {
      const collapsed = career.meta.collapsedGroups.includes(group.id);
      const defs = allDefs.filter(def => def.group === group.id && shouldShowSection(def.key));
      return `<div class="section-group">
        <button type="button" class="section-group-label" onclick="Editor.toggleGroup('${group.id}')" aria-expanded="${!collapsed}">
          <span>${h(t(group.labelKey, group.defaultLabel))}</span><span class="group-chevron">${collapsed ? '＋' : '−'}</span>
        </button>
        <div class="section-group-content" ${collapsed ? 'hidden' : ''}>${defs.map(renderSectionRow).join('')}</div>
      </div>`;
    }).join('');
    list.querySelectorAll('.section-row').forEach(row => row.addEventListener('click', () => openEditPanel(row.dataset.key)));
  }

  function renderSectionRow(s) {
    const status = getSectionStatus(s.key);
    const issue = getSectionIssue(s.key);
    const preview = getSectionPreview(s.key);
    const ar = isAr();
    const statusMap = {
      done: [ar ? 'جاهز' : 'Ready', 'status-done'],
      warn: [ar ? 'راجع' : 'Review', 'status-warn'],
      missing: [ar ? 'أكمل' : 'Complete', 'status-missing'],
      tip: [ar ? 'اختياري' : 'Optional', 'status-neutral'],
      empty: [ar ? 'اختياري' : 'Optional', 'status-neutral']
    };
    let effectiveStatus = status;
    if (issue?.severity === 'high') effectiveStatus = 'missing';
    else if (issue?.severity === 'medium' && status === 'done') effectiveStatus = 'warn';
    const [label, cls] = statusMap[effectiveStatus] || statusMap.empty;
    const supportingText = issue?.severity === 'high' || issue?.severity === 'medium' ? issue.title : preview;
    return `<button type="button" class="section-row ${issue ? `needs-attention ${issue.severity}` : ''}" data-key="${s.key}">
      <span class="section-row-icon">${s.icon}</span>
      <span class="section-row-info"><span class="section-row-label">${h(t(s.labelKey, s.defaultLabel))}</span>${supportingText ? `<span class="section-row-preview ${issue ? 'issue' : ''}">${h(supportingText)}</span>` : ''}</span>
      <span class="section-row-status"><span class="section-status ${cls}">${label}</span></span>
    </button>`;
  }

  function filterSections(query) {
    const q = query.toLowerCase();
    document.querySelectorAll('.section-row').forEach(row => {
      const label = row.querySelector('.section-row-label')?.textContent.toLowerCase() || '';
      row.style.display = label.includes(q) ? '' : 'none';
    });
  }

  // ─────────────────────────────────────────────────
  // EDIT PANEL
  // ─────────────────────────────────────────────────

  function updateExperienceChecklist() {
    if (currentEditSection !== 'experience') return;
    const exp = career.experience || [];
    let hasAction = false;
    let hasMetrics = false;
    let hasLength = false;
    
    if (exp.length > 0) {
      hasLength = true; // start true, invalidate if any fails
      exp.forEach(entry => {
        const bullets = entry.bullets || [];
        if (bullets.length < 3) hasLength = false; // "3+ bullets" rule
        bullets.forEach(b => {
          if (typeof AICoach !== 'undefined' && AICoach.hasMetric && AICoach.hasMetric(b)) hasMetrics = true;
          else if (/\d+|%|\$|\+/.test(b)) hasMetrics = true;
          
          if (/^(developed|managed|led|created|designed|implemented|improved|increased|reduced|طورت|أدرت|صممت|حققت|أنشأت|نفذت)/i.test(b)) hasAction = true;
        });
      });
      // If no bullets at all, it's not length-compliant
      if (!exp.some(e => (e.bullets || []).length > 0)) hasLength = false;
    }

    const chkAction = el('chk-action');
    const chkMetrics = el('chk-metrics');
    const chkLength = el('chk-length');

    if (chkAction) chkAction.checked = hasAction;
    if (chkMetrics) chkMetrics.checked = hasMetrics;
    if (chkLength) chkLength.checked = hasLength;
  }

  function openEditPanel(sectionKey) {

    currentEditSection = sectionKey;
    const def = getSectionDefs().find(s => s.key === sectionKey);
    if (!def) return;

    el('edit-panel-title').textContent = t(def.labelKey, def.defaultLabel);
    el('edit-panel-body').innerHTML = buildSectionCoach(sectionKey) + buildEditForm(sectionKey);
    el('edit-ai-pills').innerHTML = buildAIPills(sectionKey);
    updateExperienceChecklist();

    // Save button
    el('edit-save-btn').onclick = () => {
      collectFormData(sectionKey);
      saveAndRender();
      closeEditPanel();
    };

    // Live preview on input (Debounced) and Save on blur
    el('edit-panel-body').querySelectorAll('input, textarea, select').forEach(input => {
      input.addEventListener('input', () => {
        collectFormData(sectionKey);
        debouncedRenderPreview();
        const saveBtn = el('edit-save-btn');
        if (saveBtn && saveBtn.textContent !== 'حفظ التغييرات') {
          saveBtn.textContent = 'حفظ التغييرات';
          saveBtn.style.background = '#2563eb';
        }
      });
      input.addEventListener('blur', () => {
        collectFormData(sectionKey);
        saveAndRender();
      });
    });

    initSortable(sectionKey);
    el('edit-overlay').style.display = 'flex';
    document.body.classList.add('edit-panel-open');
    requestAnimationFrame(() => {
      const firstInput = el('edit-panel-body').querySelector('input, textarea, select');
      if (firstInput) firstInput.focus();
    });
    const saveBtn = el('edit-save-btn');
    if (saveBtn) {
      saveBtn.textContent = isAr() ? 'حفظ التغييرات' : 'Save changes';
      saveBtn.style.background = '#2563eb';
    }
  }

  function initSortable(sectionKey) {
    if (typeof Sortable === 'undefined') return;
    const listIds = { experience: 'exp-list', projects: 'proj-list', education: 'edu-list', skills: 'skill-list', languages: 'lang-list', certificates: 'cert-list', awards: 'award-list' };
    const propMap = { experience: 'experience', projects: 'projects', education: 'education', skills: 'skills', languages: 'languages', certificates: 'certificates', awards: 'awards' };
    const listId = listIds[sectionKey];
    const prop = propMap[sectionKey];
    if (!listId || !el(listId) || !prop || !career[prop] || !Array.isArray(career[prop])) return;
    
    new Sortable(el(listId), {
      animation: 150,
      handle: '.list-item-header, .skill-tag, .lang-item',
      onEnd: function (evt) {
        if (evt.oldIndex === evt.newIndex) return;
        pushUndo();
        const moved = career[prop].splice(evt.oldIndex, 1)[0];
        career[prop].splice(evt.newIndex, 0, moved);
        saveAndRender();
        openEditPanel(sectionKey);
      }
    });
  }

  function closeEditPanel(event) {
    if (event && event.target !== el('edit-overlay')) return;
    if (currentEditSection) {
      collectFormData(currentEditSection);
      saveAndRender();
    }
    el('edit-overlay').style.display = 'none';
    document.body.classList.remove('edit-panel-open');
    currentEditSection = null;
  }

  function buildAIPills(sectionKey) {
    const pills = [];
    if (['summary', 'experience', 'projects'].includes(sectionKey)) {
      pills.push({ label: (isAr() ? 'تحسين باحتراف' : 'Improve professionally'), action: `aiImprove('${sectionKey}')` });
      pills.push({ label: (isAr() ? 'ترجمة' : 'Translate'), action: `aiTranslate('${sectionKey}')` });
    }
    if (sectionKey === 'skills') {
      pills.push({ label: (isAr() ? 'اقتراح مهارات' : 'Suggest skills'), action: `aiSuggestSkills()` });
    }
    return pills.map(p => `<button class="ai-pill" onclick="Editor.${p.action}">${p.label}</button>`).join('');
  }

  function buildEditForm(key) {
    switch (key) {
      case 'personalInfo': return buildPersonalInfoForm();
      case 'summary': return buildSummaryForm();
      case 'experience': return buildExperienceForm();
      case 'projects': return buildProjectsForm();
      case 'skills': return buildSkillsForm();
      case 'education': return buildEducationForm();
      case 'languages': return buildLanguagesForm();
      case 'certificates': return buildCertificatesForm();
      case 'awards': return buildAwardsForm();
      default: return String(key || '').startsWith('custom:') ? buildCustomSectionForm(key) : `<p class="edit-empty">${t('ed.empty_edit', 'Click a field to edit this section.')}</p>`;
    }
  }

  function collectFormData(key) {
    switch (key) {
      case 'personalInfo': collectPersonalInfo(); break;
      case 'summary': collectSummary(); break;
      case 'experience': collectExperience(); break;
      case 'projects': collectProjects(); break;
      case 'skills': collectSkills(); break;
      case 'education': collectEducation(); break;
      case 'languages': collectLanguages(); break;
      case 'certificates': collectCertificates(); break;
      case 'awards': collectAwards(); break;
      default: if (String(key || '').startsWith('custom:')) collectCustomSection(key); break;
    }
  }

  function buildCustomSectionForm(key) {
    const section = getCustomSection(key);
    if (!section) return '';
    return `<div class="form-grid">
      <div class="form-field form-field-full"><label class="form-label">${isAr() ? 'عنوان القسم' : 'Section title'}</label><input class="form-input" id="f-custom-title" value="${a(section.title || '')}" placeholder="${isAr() ? 'مثال: العضويات المهنية' : 'e.g. Professional Memberships'}"></div>
      <div class="form-field form-field-full"><label class="form-label">${isAr() ? 'شكل العرض' : 'Display style'}</label><select class="form-input" id="f-custom-type"><option value="bullets" ${section.type === 'bullets' ? 'selected' : ''}>${isAr() ? 'نقاط' : 'Bullets'}</option><option value="paragraph" ${section.type === 'paragraph' ? 'selected' : ''}>${isAr() ? 'فقرة قصيرة' : 'Short paragraph'}</option><option value="tags" ${section.type === 'tags' ? 'selected' : ''}>${isAr() ? 'عناصر مختصرة' : 'Compact tags'}</option></select></div>
      <div class="form-field form-field-full"><label class="form-label">${isAr() ? 'المحتوى' : 'Content'}</label><textarea class="form-textarea" id="f-custom-content" rows="8" placeholder="${isAr() ? 'اكتب كل نقطة أو عنصر في سطر مستقل' : 'Write each bullet or item on a separate line'}">${h(section.content || '')}</textarea></div>
    </div><button type="button" class="btn-delete-custom" onclick="Editor.deleteCustomSection('${a(section.id)}')">${isAr() ? 'حذف هذا القسم' : 'Delete this section'}</button>`;
  }

  function collectCustomSection(key) {
    const section = getCustomSection(key);
    if (!section) return;
    section.title = el('f-custom-title')?.value?.trim() || section.title;
    section.type = el('f-custom-type')?.value || 'bullets';
    section.content = el('f-custom-content')?.value || '';
  }

  function emptyStateSVG() {
    return `<svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" style="opacity:0.2; margin: 20px auto; display: block;"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>`;
  }

  // ─── PERSONAL INFO ───
  function buildPersonalInfoForm() {
    const pi = career.personalInfo || {};
    const titlePlaceholder = getPh().title || fallbackJobTitle() || t('ed.form.ph_title', 'e.g. Software Engineer');
    const showProofLink = needsLinkProof();
    const proofLabel = isGithubField()
      ? 'GitHub'
      : (career.meta?.locale === 'ar' ? 'رابط الأعمال / صفحة مهنية' : 'Portfolio / Professional Page');
    const proofPlaceholder = isGithubField() ? 'https://github.com/...' : 'https://...';
    const cp = career.careerProfile || {};
    const fields = [
      ['developer', isAr() ? 'تطوير البرمجيات' : 'Software Development'],
      ['data_analyst', isAr() ? 'تحليل البيانات' : 'Data Analysis'],
      ['designer', isAr() ? 'التصميم' : 'Design'],
      ['marketing', isAr() ? 'التسويق' : 'Marketing'],
      ['accountant', isAr() ? 'المحاسبة والمالية' : 'Accounting & Finance'],
      ['hr', isAr() ? 'الموارد البشرية' : 'Human Resources'],
      ['sales', isAr() ? 'المبيعات' : 'Sales'],
      ['teacher', isAr() ? 'التعليم' : 'Education'],
      ['doctor', isAr() ? 'الطب' : 'Medicine'],
      ['nurse', isAr() ? 'التمريض' : 'Nursing'],
      ['pharmacist', isAr() ? 'الصيدلة' : 'Pharmacy'],
      ['lawyer', isAr() ? 'القانون' : 'Legal'],
      ['project_manager', isAr() ? 'إدارة المشاريع' : 'Project Management'],
      ['business_analyst', isAr() ? 'تحليل الأعمال' : 'Business Analysis'],
      ['customer_service', isAr() ? 'خدمة العملاء' : 'Customer Service'],
      ['graphic_designer', isAr() ? 'التصميم الجرافيكي' : 'Graphic Design'],
      ['ui_ux_designer', isAr() ? 'تصميم UI/UX' : 'UI/UX Design'],
      ['architect', isAr() ? 'الهندسة المعمارية' : 'Architecture'],
      ['civil_engineer', isAr() ? 'الهندسة المدنية' : 'Civil Engineering'],
      ['mechanical_engineer', isAr() ? 'الهندسة الميكانيكية' : 'Mechanical Engineering'],
      ['electrical_engineer', isAr() ? 'الهندسة الكهربائية' : 'Electrical Engineering'],
      ['dentist', isAr() ? 'طب الأسنان' : 'Dentistry'],
      ['speech_therapist', isAr() ? 'التخاطب والتأهيل' : 'Speech Therapy'],
      ['other', isAr() ? 'مجال آخر' : 'Other']
    ];
    return `
      <div class="career-profile-card">
        <div class="career-profile-head">${isAr() ? 'هويتك المهنية — تتحكم في النصائح والـ ATS' : 'Career profile — controls coaching and ATS guidance'}</div>
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label">${isAr() ? 'المجال المهني' : 'Profession'}</label>
            <select class="form-input" id="f-career-field">${fields.map(([id,label]) => `<option value="${id}" ${cp.field === id ? 'selected' : ''}>${h(label)}</option>`).join('')}</select>
          </div>
          <div class="form-field">
            <label class="form-label">${isAr() ? 'المستوى' : 'Career level'}</label>
            <select class="form-input" id="f-career-level">
              <option value="fresh" ${cp.level === 'fresh' ? 'selected' : ''}>${isAr() ? 'حديث تخرج' : 'Fresh graduate'}</option>
              <option value="junior" ${cp.level === 'junior' ? 'selected' : ''}>Junior</option>
              <option value="mid" ${cp.level === 'mid' ? 'selected' : ''}>Mid-level</option>
              <option value="senior" ${cp.level === 'senior' ? 'selected' : ''}>Senior</option>
            </select>
          </div>
          <div class="form-field">
            <label class="form-label">${isAr() ? 'التخصص الدقيق' : 'Specialization'}</label>
            <input class="form-input" id="f-career-specialization" type="text" placeholder="${isAr() ? 'مثال: محاسبة تكاليف، عناية مركزة...' : 'e.g. Cost Accounting, ICU Nursing...'}" value="${a(cp.specialization || '')}">
          </div>
          <div class="form-field">
            <label class="form-label">${isAr() ? 'سنوات الخبرة' : 'Years of experience'}</label>
            <input class="form-input" id="f-career-years" type="text" placeholder="${isAr() ? 'مثال: 7' : 'e.g. 7'}" value="${a(cp.years || '')}">
          </div>
        </div>
      </div>
      <div class="form-grid">
        <div class="form-field">
          <label class="form-label">${t('ed.form.fullName', 'Full Name')}</label>
          <input class="form-input" id="f-name" type="text" placeholder="${t('ed.form.ph_name', 'e.g. Ahmed Ali')}" value="${a(pi.name || '')}">
        </div>
        <div class="form-field">
          <label class="form-label">${isAr() ? 'المسمى المهني تحت الاسم (مثل: معلم، محاسب، مطور)' : 'Job Title (displayed under your name)'}</label>
          <input class="form-input" id="f-title" type="text" placeholder="${a(titlePlaceholder)}" value="${a(pi.title || '')}">
        </div>
        <div class="form-field">
          <label class="form-label">${t('ed.form.email', 'Email')}</label>
          <input class="form-input" id="f-email" type="email" placeholder="${t('ed.form.ph_email', 'you@example.com')}" value="${a(pi.email || '')}">
        </div>
        <div class="form-field">
          <label class="form-label">${t('ed.form.phone', 'Phone')}</label>
          <input class="form-input" id="f-phone" type="tel" placeholder="${t('ed.form.ph_phone', '+20 100 123 4567')}" value="${a(pi.phone || '')}">
        </div>
        <div class="form-field form-field-full">
          <label class="form-label">${t('ed.form.location', 'Location')}</label>
          <input class="form-input" id="f-location" type="text" placeholder="${t('ed.form.ph_location', 'City, Country')}" value="${a(pi.location || '')}">
        </div>
        <div class="form-field">
          <label class="form-label">${t('ed.form.linkedin', 'LinkedIn')}</label>
          <input class="form-input" id="f-linkedin" type="url" placeholder="${t('ed.form.ph_linkedin', 'https://linkedin.com/in/...')}" value="${a(pi.links?.linkedin || '')}">
        </div>
        ${showProofLink ? `<div class="form-field">
          <label class="form-label">${h(proofLabel)}</label>
          <input class="form-input" id="f-github" type="url" placeholder="${h(proofPlaceholder)}" value="${a(pi.links?.github || '')}">
        </div>` : ''}
        <div class="form-field form-field-full">
          <label class="form-label">${isAr() ? 'رابط صورة شخصية حقيقية (اختياري)' : 'Real profile photo URL (optional)'}</label>
          <input class="form-input" id="f-photo" type="url" placeholder="https://..." value="${a(pi.photo || '')}">
          <div class="form-hint">${isAr() ? 'لن نضع صورة تجريبية تلقائياً. استخدم صورتك فقط.' : 'We never insert a sample photo automatically. Use only your own photo.'}</div>
        </div>
      </div>
    `;
  }
  async function refreshCareerRules(newField) {
    if (!newField || career.meta?.rules?.role === newField) return;
    try {
      const lang = career.meta?.locale || 'en';
      let response = await fetch(`/knowledge-base/${lang}/${newField}/rules.json`);
      if (!response.ok) response = await fetch(`/knowledge-base/en/${newField}/rules.json`);
      career.meta = career.meta || {};
      career.meta.rules = response.ok ? await response.json() : undefined;
      renderAll();
    } catch (error) {
      console.warn('Unable to refresh profession rules', error);
      if (career.meta) delete career.meta.rules;
    }
  }

  function collectPersonalInfo() {
    if (!career.personalInfo) career.personalInfo = {};
    if (!career.personalInfo.links) career.personalInfo.links = {};
    career.careerProfile = career.careerProfile || {};
    const previousField = career.careerProfile.field || 'other';
    career.careerProfile.field = el('f-career-field')?.value || previousField;
    career.careerProfile.level = el('f-career-level')?.value || career.careerProfile.level || 'junior';
    career.careerProfile.specialization = el('f-career-specialization')?.value?.trim() || '';
    career.careerProfile.years = el('f-career-years')?.value?.trim() || '';
    career.personalInfo.name = el('f-name')?.value ?? career.personalInfo.name;
    career.personalInfo.title = el('f-title')?.value ?? career.personalInfo.title;
    career.personalInfo.email = el('f-email')?.value ?? career.personalInfo.email;
    career.personalInfo.phone = el('f-phone')?.value ?? career.personalInfo.phone;
    career.personalInfo.location = el('f-location')?.value ?? career.personalInfo.location;
    career.personalInfo.links.linkedin = el('f-linkedin')?.value ?? career.personalInfo.links.linkedin;
    if (el('f-github')) career.personalInfo.links.github = el('f-github').value;
    career.personalInfo.photo = el('f-photo')?.value?.trim() || '';
    if (career.careerProfile.field !== previousField) {
      if (career.meta) delete career.meta._resolvedTemplate;
      refreshCareerRules(career.careerProfile.field);
      resolveStyles();
    }
    updateTopbarName();
  }

  // ─── SUMMARY ───
  function buildSummaryForm() {
    const isAr = career.meta?.locale === 'ar' || document.documentElement.lang === 'ar';
    return `
      <div class="form-field form-field-full">
        <label class="form-label">${t('ed.form.summary', 'Professional Summary')}</label>
        <p class="form-hint">${t('ed.form.summary_hint', 'Write 2–3 sentences about your experience and goals. Be specific.')}</p>
        <textarea class="form-textarea" id="f-summary" rows="6" placeholder="${getPh().summary || t('ed.form.ph_summary', 'e.g. Software Engineer with 5+ years...') }">${h(career.professionalSummary || '')}</textarea>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
        <button type="button" class="btn-generate professional-ai-action" onclick="Editor.handleAIAction('generate-summary')">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"/></svg>
          <span>${isAr ? 'إنشاء أو تحسين النبذة من بياناتي' : 'Build or improve from my facts'}</span>
        </button>
      </div>
    `;
  }
  function collectSummary() {
    career.professionalSummary = el('f-summary')?.value ?? career.professionalSummary;
  }

  // ─── EXPERIENCE ───
  function buildExperienceForm() {
    const f = career.careerProfile?.field;
    let orgLabel = t('ed.form.company', 'Company');
    let orgPh = t('ed.form.ph_company', 'Company name');
    if (f === 'teacher') { orgLabel = isAr() ? 'المدرسة / المؤسسة' : 'School / Institution'; orgPh = isAr() ? 'اسم المدرسة...' : 'School name...'; }
    else if (f === 'doctor' || f === 'nurse' || f === 'dentist' || f === 'pharmacist') { orgLabel = isAr() ? 'المستشفى / العيادة' : 'Hospital / Clinic'; orgPh = isAr() ? 'اسم المستشفى أو العيادة...' : 'Hospital/Clinic name...'; }
    else if (f === 'lawyer') { orgLabel = isAr() ? 'المكتب / الجهة' : 'Law Firm / Org'; orgPh = isAr() ? 'اسم المكتب...' : 'Firm name...'; }
    
    const atWord = isAr() ? 'في' : 'at';
    
    const exps = career.experience || [];
    const items = exps.map((e, i) => `
      <div class="list-item" data-idx="${i}">
        <div class="list-item-header">
          <span class="list-item-title">${h(e.role || t('ed.form.newRole', 'New Role'))} ${atWord} ${h(e.company || '...')}</span>
          <div>
            <button class="list-item-btn" onclick="Editor.duplicateExpItem(${i})" title="${isAr() ? 'نسخ الخبرة' : 'Duplicate experience'}" aria-label="${isAr() ? 'نسخ الخبرة' : 'Duplicate experience'}"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>
            <button class="list-item-del" onclick="Editor.deleteExpItem(${i})" title="Delete">✕</button>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label">${orgLabel}</label>
            <input class="form-input" id="f-exp-co-${i}" type="text" placeholder="${orgPh}" value="${a(e.company || '')}">
          </div>
          <div class="form-field">
            <label class="form-label">${t('ed.form.role', 'Role')}</label>
            <input class="form-input" id="f-exp-role-${i}" type="text" placeholder="${getPh().title || t('ed.form.ph_role', 'Your role')}" value="${a(e.role || '')}">
          </div>
          <div class="form-field form-field-full">
            <label class="form-label">${t('ed.form.period', 'Period')}</label>
            <input class="form-input" id="f-exp-period-${i}" type="text" placeholder="${t('ed.form.ph_period', 'Jan 2022 – Present')}" value="${a(e.period || '')}">
          </div>
          <div class="form-field form-field-full">
            <label class="form-label">${t('ed.form.url', 'Reference / Verification URL (Optional)')}</label>
            <input class="form-input" id="f-exp-url-${i}" type="url" placeholder="https://..." value="${a(e.url || e.link || '')}">
          </div>
          <div class="form-field form-field-full">
            <label class="form-label">${t('ed.form.description', 'Description')}</label>
            <textarea class="form-textarea" id="f-exp-desc-${i}" rows="6" placeholder="${isAr() ? 'اكتب 2–4 نقاط، كل نقطة في سطر: ماذا فعلت؟ ما الأداة؟ ما النتيجة؟' : t('ed.form.ph_desc', 'Describe 2–4 bullet points, one per line...')}">${h(e.rawDescription || (e.bullets || []).join('\n'))}</textarea>
            <div class="professional-form-tip"><span>i</span><div><b>نصيحة:</b> اكتب مهامك الحقيقية أولاً. المساعد يعيد الصياغة ولا يضيف حقائق أو أرقاماً من عنده.</div></div>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="section-actions-top">
        <button class="btn-text-action" onclick="Editor.showExample('experience')" style="font-weight:600;color:var(--primary,#2563eb);">${isAr() ? 'عرض مثال مناسب' : 'Show relevant example'}</button>
      </div>
      <div id="exp-list">${items || `${emptyStateSVG()}<p class="edit-empty" style="text-align:center">${t('ed.empty_states.experience', 'No experience yet. Add your first job below.')}</p>`}</div>
      <button class="btn-add-item" onclick="Editor.addExpItem()">${t('ed.form.add_position', '+ Add Position')}</button>
    `;
  }
  function collectExperience() {
    const exps = career.experience || [];
    exps.forEach((e, i) => {
      e.company = el(`f-exp-co-${i}`)?.value ?? e.company;
      e.role = el(`f-exp-role-${i}`)?.value ?? e.role;
      e.period = el(`f-exp-period-${i}`)?.value ?? e.period;
      e.url = el(`f-exp-url-${i}`)?.value ?? (e.url || e.link);
      const desc = el(`f-exp-desc-${i}`)?.value || '';
      e.rawDescription = desc;
      e.bullets = desc.split('\n').filter(Boolean);
    });
    career.experience = exps;
  }

  function addExpItem() {
    pushUndo();
    career.experience = career.experience || [];
    career.experience.push({ company: '', role: '', period: '', bullets: [], rawDescription: '' });
    openEditPanel('experience');
  }
  function duplicateExpItem(idx) {
    pushUndo();
    const item = JSON.parse(JSON.stringify(career.experience[idx]));
    career.experience.splice(idx + 1, 0, item);
    saveAndRender();
    openEditPanel('experience');
  }
  function deleteExpItem(idx) {
    pushUndo();
    career.experience.splice(idx, 1);
    saveAndRender();
    openEditPanel('experience');
  }

  // ─── PROJECTS ───
  function buildProjectsForm() {
    const projs = career.projects || [];
    const items = projs.map((p, i) => `
      <div class="list-item" data-idx="${i}">
        <div class="list-item-header">
          <span class="list-item-title">${h(p.name || t('ed.form.newProject', 'New Project'))}</span>
          <div>
            <button class="list-item-btn" onclick="Editor.duplicateProjItem(${i})" title="Duplicate"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>
            <button class="list-item-del" onclick="Editor.deleteProjItem(${i})" title="Delete">✕</button>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-field form-field-full">
            <label class="form-label">${t('ed.form.projectName', 'Project Name')}</label>
            <input class="form-input" id="f-proj-name-${i}" type="text" placeholder="${getPh().projName || t('ed.form.ph_proj_name', 'e.g. My Portfolio')}" value="${a(p.name || '')}">
          </div>
          <div class="form-field form-field-full">
            <label class="form-label">${t('ed.form.description', 'Description')}</label>
            <textarea class="form-textarea" id="f-proj-desc-${i}" rows="3" placeholder="${t('ed.form.ph_proj_desc', 'What did you build?')}">${h(p.desc || '')}</textarea>
          </div>
          <div class="form-field form-field-full">
            <label class="form-label">${t('ed.form.technologies', 'Technologies')}</label>
            <input class="form-input" id="f-proj-tech-${i}" type="text" placeholder="${getPh().projTech || t('ed.form.ph_proj_tech', 'React, Node.js, AWS')}" value="${a(p.tech || '')}">
          </div>
          <div class="form-field">
            <label class="form-label">${t('ed.form.googlePlay', 'Google Play URL')}</label>
            <input class="form-input" id="f-proj-gp-${i}" type="url" placeholder="https://play.google.com/..." value="${a(p.links?.googlePlay || '')}">
          </div>
          <div class="form-field">
            <label class="form-label">${t('ed.form.appStore', 'iOS App Store URL')}</label>
            <input class="form-input" id="f-proj-ios-${i}" type="url" placeholder="https://apps.apple.com/..." value="${a(p.links?.appStore || p.links?.ios || '')}">
          </div>
          <div class="form-field">
            <label class="form-label">${t('ed.form.github', 'GitHub URL')}</label>
            <input class="form-input" id="f-proj-gh-${i}" type="url" placeholder="https://github.com/..." value="${a(p.links?.github || '')}">
          </div>
          <div class="form-field">
            <label class="form-label">${t('ed.form.demo', 'Live Demo / Website URL')}</label>
            <input class="form-input" id="f-proj-web-${i}" type="url" placeholder="https://..." value="${a(p.links?.website || p.url || '')}">
          </div>
        </div>
      </div>
    `).join('');
    return `
      <div class="section-actions-top">
        <button class="btn-text-action" onclick="Editor.showExample('projects')">${isAr() ? 'عرض مثال مناسب' : 'Show a relevant example'}</button>
      </div>
      <div id="proj-list">${items || `${emptyStateSVG()}<p class="edit-empty" style="text-align:center">${t('ed.empty_states.projects', 'No projects yet. Showcase your work!')}</p>`}</div>
      <button class="btn-add-item" onclick="Editor.addProjItem()">${t('ed.form.add_project', '+ Add Project')}</button>
    `;
  }
  function collectProjects() {
    const projs = career.projects || [];
    projs.forEach((p, i) => {
      p.name = el(`f-proj-name-${i}`)?.value ?? p.name;
      p.desc = el(`f-proj-desc-${i}`)?.value ?? p.desc;
      p.tech = el(`f-proj-tech-${i}`)?.value ?? p.tech;
      p.links = p.links || {};
      p.links.googlePlay = el(`f-proj-gp-${i}`)?.value ?? p.links.googlePlay;
      p.links.appStore = el(`f-proj-ios-${i}`)?.value ?? (p.links.appStore || p.links.ios);
      p.links.github = el(`f-proj-gh-${i}`)?.value ?? p.links.github;
      p.links.website = el(`f-proj-web-${i}`)?.value ?? (p.links.website || p.url);
    });
    career.projects = projs;
  }
  function addProjItem() {
    pushUndo();
    career.projects = career.projects || [];
    career.projects.push(CareerNormalize.normalizeProject({ name: '', desc: '' }));
    openEditPanel('projects');
  }
  function duplicateProjItem(idx) {
    pushUndo();
    const item = JSON.parse(JSON.stringify(career.projects[idx]));
    career.projects.splice(idx + 1, 0, item);
    saveAndRender();
    openEditPanel('projects');
  }
  function deleteProjItem(idx) {
    pushUndo();
    career.projects.splice(idx, 1);
    saveAndRender();
    openEditPanel('projects');
  }

  // ─── SKILLS ───
  function buildSkillsForm() {
    const cats = Object.entries(career.skills || {});
    const items = cats.map(([cat, skills], i) => `
      <div class="list-item">
        <div class="list-item-header">
           <span class="list-item-title">${h(cat || t('ed.form.newCategory', 'New Category'))}</span>
           <button class="list-item-del" onclick="Editor.deleteSkillCat(${i})" title="Delete">✕</button>
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label">${t('ed.form.category', 'Category')}</label>
            <input class="form-input" id="f-skill-cat-${i}" type="text" placeholder="${getPh().skillCat || t('ed.form.ph_skill_cat', 'e.g. Frontend')}" value="${a(cat)}">
          </div>
            <div class="form-field form-field-full">
              <label class="form-label">${isAr() ? 'المهارات — افصل بينها بفاصلة أو اضغط + من المقترحات' : t('ed.form.skills_comma', 'Skills (comma separated)')}</label>
              <input class="form-input" id="f-skill-vals-${i}" type="text" placeholder="${getPh().skills || t('ed.form.ph_skill_vals', 'React, TypeScript, CSS')}" value="${a((skills || []).join(', '))}">
              <div class="professional-form-tip"><span>i</span><div><b>نصيحة:</b> افصل بين المهارات بفاصلة، أو اختر من الاقتراحات المرتبطة بوظيفتك.</div></div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
                ${(function() {
                  const f = career.careerProfile?.field || 'developer';
                  let sugs = [];
                  if (typeof AICoach !== 'undefined' && AICoach.suggestSkills) {
                    sugs = AICoach.suggestSkills(career, []);
                  } else if (typeof OfflineHelpers !== 'undefined' && OfflineHelpers.suggestSkills) {
                    sugs = OfflineHelpers.suggestSkills(f, '', []);
                  }
                  if (!sugs || !sugs.length) {
                    const map = {
                      doctor: isAr() ? ['التشخيص الطبي', 'رعاية المرضى', 'الطوارئ والعناية', 'الفحص السريري', 'وصف العلاج', 'السجلات الطبية', 'إدارة الحالات', 'التواصل الطبي'] : ['Clinical Diagnosis', 'Patient Care', 'Emergency Medicine', 'Treatment Planning', 'Medical Records (EMR)', 'Clinical Ethics'],
                      teacher: isAr() ? ['إدارة الفصل', 'تطوير المناهج', 'التعليم التفاعلي', 'تقييم الطلاب', 'التعلم عن بعد', 'تخطيط الدروس', 'تكنولوجيا التعليم'] : ['Classroom Management', 'Curriculum Design', 'Lesson Planning', 'Student Assessment', 'EdTech Tools', 'Differentiated Instruction'],
                      accountant: isAr() ? ['Excel', 'إعداد التقارير المالية', 'التحليل المالي', 'المراجعة والتدقيق', 'أنظمة ERP', 'إدارة الميزانية', 'الضرائب'] : ['Excel', 'Financial Reporting', 'Financial Analysis', 'Auditing', 'ERP Systems', 'Tax Compliance', 'Budgeting'],
                      developer: isAr() ? ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Git', 'SQL', 'REST APIs', 'Problem Solving'] : ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Git', 'SQL', 'REST APIs', 'System Design']
                    };
                    sugs = map[f] || map.developer;
                  }
                  return sugs.slice(0, 10).map(sk => `
                    <button type="button" style="background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;padding:4px 10px;border-radius:14px;font-size:12px;cursor:pointer;font-weight:500;" onclick="Editor.appendSkillToInput(${i}, '${sk.replace(/'/g, "\\'")}')">+ ${sk}</button>
                  `).join('');
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    `).join('');
    return `
      <div id="skill-list">${items || `${emptyStateSVG()}<p class="edit-empty" style="text-align:center">${t('ed.empty_states.skills', 'No skills yet. Add your top skills.')}</p>`}</div>
      <button class="btn-add-item" onclick="Editor.addSkillCat()">${t('ed.form.add_category', '+ Add Category')}</button>
    `;
  }
  function collectSkills() {
    const newSkills = {};
    const items = document.querySelectorAll('#skill-list .list-item');
    items.forEach((_, i) => {
      const cat = el(`f-skill-cat-${i}`)?.value?.trim();
      const vals = el(`f-skill-vals-${i}`)?.value?.split(',').map(s => s.trim()).filter(Boolean);
      if (cat && vals?.length) newSkills[cat] = vals;
    });
    career.skills = newSkills;
  }
  function addSkillCat() {
    pushUndo();
    career.skills = career.skills || {};
    career.skills[t('ed.form.newCategory', 'New Category')] = [];
    openEditPanel('skills');
  }
  function deleteSkillCat(index) {
    pushUndo();
    const key = Object.keys(career.skills || {})[index];
    if (key) delete career.skills[key];
    saveAndRender();
    openEditPanel('skills');
  }
  function appendSkillToInput(index, skill) {
    const inp = el(`f-skill-vals-${index}`);
    if (!inp) return;
    const current = inp.value.trim();
    if (!current) {
      inp.value = skill;
    } else {
      const parts = current.split(',').map(s => s.trim());
      if (!parts.includes(skill)) {
        inp.value = current + ', ' + skill;
      }
    }
    collectSkills();
    saveAndRender();
  }

  // ─── EDUCATION ───
  function buildEducationForm() {
    const edus = career.education || [];
    const items = edus.map((e, i) => `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${h(e.degree || t('ed.form.degree_fallback', 'Degree'))}</span>
          <div>
            <button class="list-item-btn" onclick="Editor.duplicateEduItem(${i})" title="Duplicate"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>
            <button class="list-item-del" onclick="Editor.deleteEduItem(${i})" title="Delete">✕</button>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-field form-field-full">
            <label class="form-label">${t('ed.form.degree', 'Degree / Qualification')}</label>
            <input class="form-input" id="f-edu-deg-${i}" type="text" placeholder="${getPh().degree || t('ed.form.ph_degree', 'e.g. BSc Computer Science')}" value="${a(e.degree || '')}">
          </div>
          <div class="form-field">
            <label class="form-label">${t('ed.form.institution', 'Institution')}</label>
            <input class="form-input" id="f-edu-school-${i}" type="text" placeholder="${t('ed.form.ph_school', 'e.g. Cairo University')}" value="${a(e.school || '')}">
          </div>
          <div class="form-field">
            <label class="form-label">${t('ed.form.year', 'Year')}</label>
            <input class="form-input" id="f-edu-year-${i}" type="text" placeholder="${t('ed.form.ph_year', 'e.g. 2022')}" value="${a(e.year || '')}">
          </div>
          <div class="form-field form-field-full">
            <label class="form-label">${t('ed.form.certUrl', 'Certificate / Credential Verification URL (Optional)')}</label>
            <input class="form-input" id="f-edu-url-${i}" type="url" placeholder="https://..." value="${a(e.url || e.certUrl || e.link || '')}">
          </div>
        </div>
      </div>
    `).join('');
    return `
      <div id="edu-list">${items || `${emptyStateSVG()}<p class="edit-empty" style="text-align:center">${t('ed.empty_states.education', 'No education yet.')}</p>`}</div>
      <button class="btn-add-item" onclick="Editor.addEduItem()">${t('ed.form.add_education', '+ Add Education')}</button>
    `;
  }
  function collectEducation() {
    const edus = career.education || [];
    edus.forEach((e, i) => {
      e.degree = el(`f-edu-deg-${i}`)?.value ?? e.degree;
      e.school = el(`f-edu-school-${i}`)?.value ?? e.school;
      e.year = el(`f-edu-year-${i}`)?.value ?? e.year;
      e.url = el(`f-edu-url-${i}`)?.value ?? (e.url || e.certUrl || e.link);
    });
    career.education = edus;
  }
  function addEduItem() {
    pushUndo();
    career.education = career.education || [];
    career.education.push({ degree: '', school: '', year: '' });
    openEditPanel('education');
  }
  function duplicateEduItem(idx) {
    pushUndo();
    const item = JSON.parse(JSON.stringify(career.education[idx]));
    career.education.splice(idx + 1, 0, item);
    saveAndRender();
    openEditPanel('education');
  }
  function deleteEduItem(idx) {
    pushUndo();
    career.education.splice(idx, 1);
    saveAndRender();
    openEditPanel('education');
  }

  // ─── LANGUAGES ───
  function buildLanguagesForm() {
    const langs = career.languages || [];
    const items = langs.map((l, i) => `
      <div class="list-item">
        <div class="list-item-header">
           <span class="list-item-title">${h(l.lang || 'Language')}</span>
           <div>
            <button class="list-item-btn" onclick="Editor.duplicateLangItem(${i})" title="Duplicate"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>
            <button class="list-item-del" onclick="Editor.deleteLangItem(${i})" title="Delete">✕</button>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label">${t('ed.form.language', 'Language')}</label>
            <input class="form-input" id="f-lang-${i}" type="text" placeholder="${t('ed.form.ph_lang', 'e.g. Arabic')}" value="${a(l.lang || '')}">
          </div>
          <div class="form-field">
            <label class="form-label">${t('ed.form.level', 'Level')}</label>
            <input class="form-input" id="f-lang-level-${i}" type="text" placeholder="${t('ed.form.ph_lang_level', 'e.g. Native')}" value="${a(l.level || '')}">
          </div>
        </div>
      </div>
    `).join('');
    return `
      <div id="lang-list">${items || `${emptyStateSVG()}<p class="edit-empty" style="text-align:center">${t('ed.empty_states.languages', 'No languages yet.')}</p>`}</div>
      <button class="btn-add-item" onclick="Editor.addLangItem()">${t('ed.form.add_language', '+ Add Language')}</button>
    `;
  }
  function collectLanguages() {
    const langs = career.languages || [];
    langs.forEach((l, i) => {
      l.lang = el(`f-lang-${i}`)?.value ?? l.lang;
      l.level = el(`f-lang-level-${i}`)?.value ?? l.level;
    });
    career.languages = langs;
  }
  function addLangItem() {
    pushUndo();
    career.languages = career.languages || [];
    career.languages.push({ lang: '', level: '' });
    openEditPanel('languages');
  }
  function duplicateLangItem(idx) {
    pushUndo();
    const item = JSON.parse(JSON.stringify(career.languages[idx]));
    career.languages.splice(idx + 1, 0, item);
    saveAndRender();
    openEditPanel('languages');
  }
  function deleteLangItem(idx) {
    pushUndo();
    career.languages.splice(idx, 1);
    saveAndRender();
    openEditPanel('languages');
  }
  
  // ─── EXAMPLES ───
  function showExample(section) {
    const example = getLocalizedExample(section);
    showNoticeModal({
      title: example.title,
      body: example.body,
      confirmText: isAr() ? 'تمام' : 'Got it'
    });
  }

  function getLocalizedExample(section) {
    const field = currentField();
    const ar = isAr();
    const examples = {
      experience: {
        accountant: {
          ar: 'محاسب في شركة تجارية\nراجعت القيود اليومية وساعدت في تجهيز التقارير الشهرية.\nتابعت الفواتير والمصروفات وساهمت في تقليل الأخطاء المحاسبية.\nاستخدمت Excel وبرنامج ERP لتنظيم البيانات المالية.',
          en: 'Accountant at a trading company\nReviewed daily journal entries and helped prepare monthly reports.\nTracked invoices and expenses, reducing accounting errors.\nUsed Excel and ERP software to organize financial data.'
        },
        doctor: {
          ar: 'طبيب مقيم في مستشفى عام\nتابعت حالات المرضى وشاركت في التشخيص ووضع خطط العلاج.\nوثقت البيانات الطبية بدقة وتواصلت مع المرضى وأسرهم بوضوح.\nالتزمت ببروتوكولات السلامة ومكافحة العدوى.',
          en: 'Resident Doctor at a general hospital\nMonitored patient cases and supported diagnosis and treatment planning.\nDocumented medical records accurately and communicated clearly with patients.\nFollowed safety and infection-control protocols.'
        },
        teacher: {
          ar: 'مدرس لغة عربية\nحضرت خطط دروس أسبوعية وشرحت المناهج بطريقة مبسطة.\nتابعت مستوى الطلاب من خلال اختبارات قصيرة وأنشطة صفية.\nتواصلت مع أولياء الأمور لتحسين تقدم الطلاب.',
          en: 'Arabic Teacher\nPrepared weekly lesson plans and explained curriculum topics clearly.\nTracked student progress through short assessments and class activities.\nCommunicated with parents to support student improvement.'
        },
        developer: {
          ar: 'مطور واجهات أمامية\nطورت صفحات ويب متجاوبة باستخدام React وJavaScript.\nحسنت سرعة تحميل الواجهة ونظمت مكونات قابلة لإعادة الاستخدام.\nتعاونت مع فريق التصميم والباك إند لتسليم الميزات في الوقت المحدد.',
          en: 'Frontend Developer\nBuilt responsive web pages using React and JavaScript.\nImproved page loading speed and organized reusable components.\nWorked with design and backend teams to deliver features on time.'
        },
        other: {
          ar: 'اكتب اسم الوظيفة والمكان\nاذكر مسؤولياتك الأساسية في جمل واضحة.\nركز على نتيجة أو أثر حقيقي من شغلك.\nاستخدم أفعال قوية مثل: تابعت، نظمت، حسنت، ساعدت.',
          en: 'Write your role and workplace\nMention your main responsibilities in clear sentences.\nFocus on a real result or impact from your work.\nUse strong verbs such as managed, improved, organized, supported.'
        }
      },
      projects: {
        developer: {
          ar: 'مشروع: منصة حجز مواعيد\nالتقنيات: React, Node.js, MongoDB\nبنيت نظاما لإدارة المواعيد وتسجيل المستخدمين ولوحة تحكم بسيطة.\nحسنت تجربة المستخدم وقللت خطوات الحجز.',
          en: 'Project: Appointment Booking Platform\nTechnologies: React, Node.js, MongoDB\nBuilt a system for booking appointments, user registration, and a simple dashboard.\nImproved user experience and reduced booking steps.'
        },
        designer: {
          ar: 'مشروع: هوية بصرية لعيادة\nالأدوات: Figma, Illustrator\nصممت شعارا ولوحة ألوان ونماذج منشورات متناسقة.\nراعيت وضوح الهوية وسهولة استخدامها على السوشيال ميديا.',
          en: 'Project: Clinic Brand Identity\nTools: Figma, Illustrator\nDesigned a logo, color palette, and social media templates.\nFocused on clarity and consistent brand usage.'
        },
        marketing: {
          ar: 'مشروع: حملة تسويق لمطعم\nالأدوات: Meta Ads, Content Calendar\nجهزت خطة محتوى وإعلانات ممولة لمدة شهر.\nتابعت النتائج وعدلت الرسائل لتحسين التفاعل.',
          en: 'Project: Restaurant Marketing Campaign\nTools: Meta Ads, Content Calendar\nPrepared a one-month content and paid ads plan.\nTracked performance and refined messaging to improve engagement.'
        },
        other: {
          ar: 'اسم المشروع\nاكتب الهدف من المشروع ومن استفاد منه.\nاذكر الأدوات أو الخطوات التي استخدمتها.\nوضح النتيجة أو الشيء الذي تعلمته.',
          en: 'Project name\nDescribe the project goal and who benefited from it.\nMention the tools or steps you used.\nExplain the result or what you learned.'
        }
      }
    };
    const pack = examples[section] || examples.experience;
    const item = pack[field] || pack.other;
    return {
      title: ar ? 'مثال يولع الدنيا' : 'Relevant example',
      body: ar ? item.ar : item.en
    };
  }

  // ─────────────────────────────────────────────────
  function severityLabel(severity) {
    if (severity === 'blocker' || severity === 'high') return t('ed.coach.blocker', 'تنبيه هام');
    if (severity === 'warn' || severity === 'medium') return t('ed.coach.warn', 'مقترح تحسين');
    if (severity === 'good') return t('ed.coach.good', 'جيد');
    return t('ed.coach.tip', 'إضافة اختيارية');
  }

  function buildSectionCoach(sectionKey) {
    if (String(sectionKey || '').startsWith('custom:')) {
      return `<div class="section-coach"><div class="section-coach-kicker">${isAr() ? 'نصيحة' : 'Tip'}</div><div class="section-coach-item low"><div class="section-coach-title">${isAr() ? 'استخدم هذا القسم فقط عند الحاجة' : 'Use this section only when relevant'}</div><div class="section-coach-detail">${isAr() ? 'اختر عنوانًا واضحًا، واكتب معلومات حقيقية مختصرة لا تتكرر في قسم آخر.' : 'Use a clear title and concise facts that do not duplicate another section.'}</div></div></div>`;
    }
    if (typeof AICoach === 'undefined') return '';
    const advice = AICoach.getSectionAdvice(career, sectionKey).slice(0, 2);
    let html = `
      <div class="section-coach">
        <div class="section-coach-kicker">${h(coachName())}</div>
        ${advice.map(item => `
          <div class="section-coach-item ${item.severity}">
            <div class="section-coach-title">${h(item.title)}</div>
            <div class="section-coach-detail">${h(item.detail)}</div>
          </div>
        `).join('')}
      </div>`;
      
    if (sectionKey === 'experience') {
      const isAr = career.meta?.locale === 'ar' || document.documentElement.lang === 'ar';
      html += `
        <div class="interactive-checklist" id="experience-coach-checklist" style="margin-bottom: 15px; padding: 12px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px;">
          <div style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 8px; text-transform: uppercase;">
            ${isAr ? 'قائمة فحص الخبرة' : 'Experience Checklist'}
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <input type="checkbox" id="chk-action" disabled style="accent-color: #22c55e; width: 14px; height: 14px;">
            <label style="font-size: 13px; color: #334155; font-weight: 600;">${isAr ? 'أفعال إنجاز (طورت، أدرت،...)' : 'Action Verbs (Developed, Managed...)'}</label>
          </div>
          <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 6px;">
            <input type="checkbox" id="chk-metrics" disabled style="accent-color: #22c55e; width: 14px; height: 14px;">
            <label style="font-size: 13px; color: #334155; font-weight: 600;">${isAr ? 'أثر بالأرقام (٪، $، أرقام)' : 'Measured Impact (%, $, numbers)'}</label>
          </div>
          <div style="display: flex; align-items: center; gap: 8px;">
            <input type="checkbox" id="chk-length" disabled style="accent-color: #22c55e; width: 14px; height: 14px;">
            <label style="font-size: 13px; color: #334155; font-weight: 600;">${isAr ? '٣ نقط أو أكثر لكل وظيفة' : '3+ bullets per role'}</label>
          </div>
        </div>
      `;
    }
    return html;
  }

  function renderCoachPanel() {
    const panel = el('ai-coach-panel');
    if (!panel || typeof AICoach === 'undefined') return;
    const review = AICoach.getPreExportReview(career);
    const next = review.items.slice(0, 6);
    if (!next.length) {
      panel.innerHTML = `
        <div class="rpanel-label">${h(coachName())}</div>
        <div class="coach-score good">
          <div class="coach-score-number">${review.score}%</div>
          <div class="coach-score-copy">${t('ed.coach.ready', 'Ready to export. Do one last visual scan, then download.')}</div>
        </div>`;
      return;
    }

    panel.innerHTML = `
      <div class="rpanel-label">${h(coachName())}</div>
      <div class="coach-score ${review.blockers ? 'blocker' : review.warnings ? 'warn' : 'good'}">
        <div class="coach-score-number">${review.score}%</div>
        <div class="coach-score-copy">${review.blockers ? t('ed.coach.blockers_copy', 'Fix blockers before exporting.') : t('ed.coach.next_copy', 'Best next improvements for this CV.')}</div>
      </div>
      <div class="coach-actions-list">
        ${next.map(item => `
          <button class="coach-action ${item.severity}" onclick="Editor.applyCoachFix('${item.id}')">
            <span class="coach-action-badge">${h(severityLabel(item.severity))}</span>
            <span class="coach-action-title">${h(item.title)}</span>
            <span class="coach-action-detail">${h(item.detail)}</span>
          </button>
        `).join('')}
      </div>
      <button class="rpanel-link" onclick="Editor.showExportModal()">${t('ed.coach.review_all', 'Review before export')}</button>
    `;
  }

  function showSmartFixPreviewModal(draftCareer, beforeText, afterText, title, successMsg) {
    el('smartfix-preview-modal')?.remove();
    const ar = isAr();
    const modal = document.createElement('div');
    modal.id = 'smartfix-preview-modal';
    modal.className = 'modal-overlay smartfix-overlay';
    modal.style.display = 'flex';
    modal.onclick = event => { if (event.target === modal) modal.remove(); };
    modal.innerHTML = `<div class="modal-box smartfix-modal" dir="${ar ? 'rtl' : 'ltr'}">
      <div class="modal-header"><div><h3>${h(title || (ar ? 'راجع الصياغة المقترحة' : 'Review the proposed wording'))}</h3><p>${ar ? 'المساعد يعيد صياغة ما كتبته فقط. راجع الحقائق والأرقام قبل الاعتماد.' : 'The assistant rewrites only what you provided. Verify every fact and metric before applying.'}</p></div><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
      <div class="smartfix-compare">
        <section class="smartfix-column before"><header><span>${ar ? 'النص الحالي' : 'Current text'}</span></header><div>${h(beforeText || (ar ? 'لا يوجد محتوى كافٍ' : 'Not enough content')).replace(/\n/g,'<br>')}</div></section>
        <section class="smartfix-column after"><header><span>${ar ? 'الصياغة المقترحة' : 'Proposed wording'}</span><b>${ar ? 'للمراجعة' : 'Review'}</b></header><div>${h(afterText || '').replace(/\n/g,'<br>')}</div></section>
      </div>
      <div class="smartfix-note">${ar ? 'لن تُضاف مهارة أو شركة أو رقم لم تذكره. بعد التطبيق يمكنك تعديل النص مباشرة من القسم.' : 'No unverified skill, employer, or metric is added. You can edit the result immediately after applying.'}</div>
      <div class="smartfix-actions"><button type="button" class="secondary" onclick="this.closest('.modal-overlay').remove()">${ar ? 'الاحتفاظ بالنص الحالي' : 'Keep current'}</button><button type="button" id="btn-apply-smartfix-now">${ar ? 'استخدام الصياغة وتعديلها' : 'Use and continue editing'}</button></div>
    </div>`;
    document.body.appendChild(modal);
    el('btn-apply-smartfix-now').onclick = () => {
      pushUndo();
      career = JSON.parse(JSON.stringify(draftCareer));
      saveAndRender();
      showSaveIndicator(successMsg || (ar ? 'تم تطبيق الصياغة' : 'Wording applied'), true);
      modal.remove();
      if (currentEditSection) openEditPanel(currentEditSection);
      if (typeof renderExportReview === 'function') renderExportReview();
      if (typeof updateCoachPanel === 'function') updateCoachPanel();
    };
  }

  function extractSectionTextForCompare(cObj, issueId) {
    if (!cObj) return '';
    if (issueId?.includes('summary') || issueId === 'missing-summary' || issueId === 'auto-summary') return cObj.professionalSummary || '';
    if (issueId?.includes('skills') || issueId === 'few-skills' || issueId === 'auto-skills') return Object.values(cObj.skills || {}).flat().filter(Boolean).join(', ');
    if (issueId?.includes('bullet') || issueId?.includes('exp') || issueId === 'thin-bullet' || issueId === 'auto-bullets' || issueId === 'weak-experience') {
      const ar = cObj.meta?.locale === 'ar';
      return (cObj.experience || []).map(entry => {
        const heading = [entry.role, entry.company].filter(Boolean).join(ar ? ' — ' : ' at ');
        const bullets = (entry.bullets || []).filter(Boolean).map(item => `• ${item}`).join('\n');
        return [heading, bullets].filter(Boolean).join('\n');
      }).join('\n\n');
    }
    return '';
  }

  async function applyCoachFix(issueId) {
    if (typeof AICoach === 'undefined' || !career) return;
    const draftCareer = JSON.parse(JSON.stringify(career));
    const beforeText = extractSectionTextForCompare(career, issueId);
    const result = await AICoach.applyQuickFix(draftCareer, issueId);
    if (JSON.stringify(career) !== JSON.stringify(draftCareer)) {
      const afterText = extractSectionTextForCompare(draftCareer, issueId);
      showSmartFixPreviewModal(draftCareer, beforeText, afterText, result.title || _ct('coach.smart_fix.title', 'معاينة التحسين الذكي'), result.message);
      return;
    }
    const review = AICoach.getPreExportReview(career);
    const item = review?.items?.find(x => x.id === issueId);
    if (item?.section) openEditPanel(item.section);
  }

  function renderExportReview() {
    const root = el('export-review');
    if (!root || typeof AICoach === 'undefined') return;
    const review = AICoach.getPreExportReview(career);
    const top = review.items.slice(0, 6);
    root.innerHTML = `
      <div class="export-review-card ${review.blockers ? 'blocker' : review.warnings ? 'warn' : 'good'}">
        <div class="export-review-head">
          <div>
            <div class="export-review-kicker">${t('ed.coach.pre_export', 'AI Pre-export Review')}</div>
            <div class="export-review-title">${review.blockers ? t('ed.coach.not_ready', 'Not ready yet') : review.warnings ? t('ed.coach.almost_ready', 'Almost ready') : t('ed.coach.export_ready', 'Ready to export')}</div>
          </div>
          <div class="export-review-score">${review.score}%</div>
        </div>
        ${top.length ? `<div class="export-review-items">${top.map(item => `
          <div class="export-review-item ${item.severity}">
            <div>
              <div class="export-review-item-title">${h(item.title)}</div>
              <div class="export-review-item-detail">${h(item.detail)}</div>
            </div>
            <button onclick="Editor.applyCoachFix('${item.id}')">${h(item.actionLabel)}</button>
          </div>
        `).join('')}</div>` : `<p class="export-review-empty">${t('ed.coach.clean', 'No major issues found.')}</p>`}
      </div>`;
  }

  // HEALTH PANEL
  // ─────────────────────────────────────────────────
  function renderHealthPanel() {
    const result = ATSScorer.score(career);
    const panel = el('cv-health-panel');
    if (!panel) return;

    const stars = Array.from({ length: 5 }, (_, i) => i < result.stars ? '★' : '☆').join('');
    const pct = result.percent || 0;
    
    let labelKey = 'ed.health.incomplete';
    let labelDefault = 'Incomplete';
    if(pct >= 80) { labelKey = 'ed.health.great'; labelDefault = 'Great'; }
    else if(pct >= 60) { labelKey = 'ed.health.good'; labelDefault = 'Good'; }
    else if(pct >= 40) { labelKey = 'ed.health.needs_work'; labelDefault = 'Needs work'; }
    
    const label = t(labelKey, labelDefault);

    const sectionRows = Object.entries(result.sections || {}).map(([key, data]) => {
      const dot = data.status === 'green' ? '🟢' : data.status === 'yellow' ? '🟡' : '🔴';
      let sLabel = key;
      if(key === 'personalInfo') sLabel = t('ed.health.personal', 'Personal');
      else if(key === 'summary') sLabel = t('ed.sections.summary', 'Summary');
      else if(key === 'experience') sLabel = t('ed.sections.experience', 'Experience');
      else if(key === 'projects') sLabel = t('ed.sections.projects', 'Projects');
      else if(key === 'skills') sLabel = t('ed.sections.skills', 'Skills');
      else if(key === 'education') sLabel = t('ed.sections.education', 'Education');
      
      return `<div class="health-row" onclick="Editor.openEditPanel('${key}')">
        <span class="health-dot">${dot}</span>
        <span class="health-label">${sLabel}</span>
      </div>`;
    }).join('');

    panel.innerHTML = `
      <div class="rpanel-label">${t('ed.health.strength', 'Resume Strength')}</div>
      <div class="health-score-row">
        <span class="health-score-pct">${pct}%</span>
        <span class="health-stars">${stars}</span>
        <span class="health-badge health-badge-${result.status || 'fair'}">${label}</span>
      </div>
      <div class="health-rows">${sectionRows}</div>
    `;
  }

  // ─────────────────────────────────────────────────
  // AI SUGGESTIONS
  // ─────────────────────────────────────────────────
  function renderAISuggestions() {
    const panel = el('ai-suggestions-panel');
    if (!panel) return;
    const suggestions = Suggestions.getAIActionSuggestions(career);

    if (suggestions.length === 0) {
      panel.innerHTML = `
        <div class="rpanel-label">${t('ed.ai_panel.assistant', 'AI Assistant')}</div>
        <div class="suggestions-empty">
          <div class="suggestions-empty-icon"><svg viewBox="0 0 24 24"><path d="M12 3v4M12 17v4M3 12h4M17 12h4M6.3 6.3l2.8 2.8M14.9 14.9l2.8 2.8M17.7 6.3l-2.8 2.8M9.1 14.9l-2.8 2.8"/></svg></div>
          <p>${t('ed.ai_panel.empty', 'Your resume looks great! No suggestions right now.')}</p>
        </div>`;
      return;
    }

    panel.innerHTML = `
      <div class="rpanel-label">${t('ed.ai_panel.suggestions', 'AI Suggestions')}</div>
      ${suggestions.map(s => `
        <div class="suggestion-card" onclick="Editor.handleAIAction('${s.action}')">
          <span class="suggestion-icon">${h(s.icon)}</span>
          <div class="suggestion-text">
            <div class="suggestion-title">${h(s.title)}</div>
            <div class="suggestion-desc">${h(s.description)}</div>
          </div>
        </div>
      `).join('')}
    `;
  }

  // ─────────────────────────────────────────────────
  // TEMPLATE PICKER
  // ─────────────────────────────────────────────────
  const TEMPLATE_PRESENTATION = {
    ats: { ar: ['ATS احترافي', 'أوضح اختيار للقراءة الآلية والوظائف التقليدية'], en: ['Professional ATS', 'The clearest option for parsing and traditional roles'], className: 'preview-ats', badgeAr: 'الأكثر أمانًا', badgeEn: 'ATS-safe' },
    classic: { ar: ['كلاسيكي أنيق', 'تسلسل هادئ مناسب للتعليم والمجالات الرسمية'], en: ['Refined Classic', 'A calm hierarchy for education and formal roles'], className: 'preview-classic' },
    modern: { ar: ['حديث نظيف', 'عمود جانبي متزن للمجالات الرقمية والإبداعية'], en: ['Clean Modern', 'A balanced sidebar for digital and creative roles'], className: 'preview-modern' },
    corporate: { ar: ['احترافي إداري', 'مناسب للخبرات المتوسطة والإدارة'], en: ['Corporate Professional', 'Designed for mid-career and management'], className: 'preview-corporate' },
    executive: { ar: ['تنفيذي', 'طابع هادئ للقيادات والخبرات الطويلة'], en: ['Executive', 'A restrained style for leadership profiles'], className: 'preview-executive' }
  };

  function templatePreviewMarkup(id) {
    const meta = TEMPLATE_PRESENTATION[id] || TEMPLATE_PRESENTATION.ats;
    return `<div class="template-preview-sheet ${meta.className}">
      <div class="tp-sidebar"></div><div class="tp-header"></div>
      <div class="tp-content"><i class="tp-name"></i><i class="tp-role"></i><i class="tp-contact"></i>
        <b class="tp-heading"></b><i class="tp-line long"></i><i class="tp-line"></i><i class="tp-line short"></i>
        <b class="tp-heading second"></b><i class="tp-line long"></i><i class="tp-line"></i><i class="tp-line medium"></i>
        <b class="tp-heading third"></b><i class="tp-line long"></i><i class="tp-line short"></i>
      </div>
    </div>`;
  }

  function featuredTemplateIds() { return ['ats', 'classic', 'modern', 'corporate', 'executive']; }

  function renderTemplatePicker() {
    const root = el('template-picker');
    if (!root) return;
    const effective = TemplateSelector.getEffectiveTemplateId(career);
    root.innerHTML = featuredTemplateIds().slice(0, 3).map(id => {
      const meta = TEMPLATE_PRESENTATION[id];
      const copy = meta[isAr() ? 'ar' : 'en'];
      return `<button type="button" class="template-mini-choice ${effective === id ? 'active' : ''}" onclick="Editor.setTemplate('${id}')">${templatePreviewMarkup(id)}<span>${h(copy[0])}</span></button>`;
    }).join('');
  }

  function setTemplate(id) {
    pushUndo();
    career.meta.templateId = id;
    if (id === 'ai-recommended') {
      ContentPicker.getProfile(career).then(profile => {
        career.meta._resolvedTemplate = TemplateSelector.resolveRecommendedTemplate(career, profile);
        saveAndRender();
      });
    } else {
      career.meta._resolvedTemplate = id;
      saveAndRender();
    }
  }

  // ── Mobile / Tablet View Switching ──────────────────────────────────
  let currentMobileView = 'edit';
  let editScrollPos = 0;
  let previewScrollPos = 0;

  function setMobileView(view) {
    if (currentMobileView === view) return;
    
    // Save current scroll
    if (currentMobileView === 'edit') editScrollPos = window.scrollY;
    if (currentMobileView === 'preview') previewScrollPos = window.scrollY;

    currentMobileView = view;
    const body = document.body;
    body.classList.remove('mobile-edit-mode', 'mobile-preview-mode', 'mobile-coach-mode');

    const mobControls = el('mob-preview-controls');
    if (mobControls) mobControls.style.display = view === 'preview' ? 'flex' : 'none';

    if (view === 'edit') {
      body.classList.add('mobile-edit-mode');
      setTimeout(() => window.scrollTo(0, editScrollPos), 10);
    } else if (view === 'preview') {
      body.classList.add('mobile-preview-mode');
      applyMobileScale();
      setTimeout(() => window.scrollTo(0, previewScrollPos), 10);
    } else if (view === 'coach') {
      body.classList.add('mobile-coach-mode');
      setTimeout(() => window.scrollTo(0, 0), 10);
    }

    // Update nav active state
    const editBtn = el('mob-btn-edit');
    const prevBtn = el('mob-btn-preview');
    const coachBtn = el('mob-btn-coach');
    if (editBtn) editBtn.classList.toggle('active', view === 'edit');
    if (prevBtn) prevBtn.classList.toggle('active', view === 'preview');
    if (coachBtn) coachBtn.classList.toggle('active', view === 'coach');

    // Sync mobile topbar title
    const mobName = el('mob-topbar-name');
    const topbarName = el('topbar-name');
    if (mobName && topbarName) mobName.textContent = topbarName.textContent;
  }

  function showMobMenu(event) {
    event?.stopPropagation?.();
    const existing = el('mob-dropdown-menu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.id = 'mob-dropdown-menu';
    menu.className = 'mob-dropdown-menu';
    menu.innerHTML = `
      <button onclick="Editor.undoAction(); this.closest('#mob-dropdown-menu').remove();"><span class="icon">↶</span><span>${isAr() ? 'تراجع' : 'Undo'}</span></button>
      <button onclick="Editor.redoAction(); this.closest('#mob-dropdown-menu').remove();"><span class="icon">↷</span><span>${isAr() ? 'إعادة' : 'Redo'}</span></button>
      <button onclick="document.getElementById('style-drawer-modal').style.display='flex'; this.closest('#mob-dropdown-menu').remove();"><span class="icon">◫</span><span>${isAr() ? 'القالب والتصميم' : 'Template & design'}</span></button>
      <button onclick="Editor.showAddSectionModal(); this.closest('#mob-dropdown-menu').remove();"><span class="icon">＋</span><span>${isAr() ? 'إضافة قسم' : 'Add section'}</span></button>
      <button onclick="Editor.showExportModal(); this.closest('#mob-dropdown-menu').remove();"><span class="icon">↓</span><span>${isAr() ? 'تحميل السيرة' : 'Download resume'}</span></button>
      <button class="menu-secondary" onclick="Editor.showVersionManagerModal(); this.closest('#mob-dropdown-menu').remove();"><span class="icon">▣</span><span>${isAr() ? 'نسخ مخصصة للوظائف' : 'Job-specific versions'}</span></button>
      <a href="landing.html" class="menu-link"><span class="icon">×</span><span>${isAr() ? 'خروج' : 'Exit'}</span></a>`;
    document.body.appendChild(menu);
    const close = e => {
      if (!menu.contains(e.target) && !e.target?.closest?.('.mob-topbar-menu') && !e.target?.closest?.('.topbar-icon-btn')) {
        menu.remove(); document.removeEventListener('click', close);
      }
    };
    setTimeout(() => document.addEventListener('click', close), 10);
  }

  function applyMobileScale() {
    const isMobile = window.matchMedia('(max-width: 1024px)').matches;
    if (!isMobile) return;
    const canvas = el('editor-canvas');
    const paper = el('a4-wrapper');
    if (!canvas || !paper) return;
    const availW = Math.max(280, canvas.clientWidth - 12);
    const scale = Math.min(1, availW / 794);
    if (career && career.meta?.zoomLevel && career.meta.zoomLevel !== 'fit-width' && career.meta.zoomLevel !== 'fit-page') {
      const customScale = parseInt(career.meta.zoomLevel, 10) / 100;
      paper.style.width = `${availW}px`;
      paper.style.display = 'flex';
      paper.style.justifyContent = 'center';
      paper.style.alignItems = 'flex-start';
      paper.style.margin = '0 auto';
      const frame = el('preview-frame');
      if (frame) {
        frame.style.width = '794px';
        frame.style.flex = '0 0 794px';
        frame.style.transform = `scale(${customScale})`;
        frame.style.transformOrigin = 'top center';
        const height = frame.scrollHeight || 1123;
        paper.style.height = `${height * customScale}px`;
        paper.style.marginBottom = '24px';
      }
      return;
    }
    paper.style.width = `${availW}px`;
    paper.style.display = 'flex';
    paper.style.justifyContent = 'center';
    paper.style.alignItems = 'flex-start';
    paper.style.margin = '0 auto';
    const frame = el('preview-frame');
    if (frame) {
      frame.style.width = '794px';
      frame.style.flex = '0 0 794px';
      frame.style.transform = `scale(${scale})`;
      frame.style.transformOrigin = 'top center';
      const height = frame.scrollHeight || 1123;
      paper.style.height = `${height * scale}px`;
      paper.style.marginBottom = '24px';
    }
  }

  function updateMobScoreBar() {
    const isMobile = window.matchMedia('(max-width: 1024px)').matches;
    if (!isMobile) return;
    try {
      const result = typeof AICoach !== 'undefined' ? AICoach.buildCoachInsights(career) : null;
      const pct = Number(result?.score || 0);
      const label = pct >= 80 ? (isAr() ? 'قوية' : 'Strong') : pct >= 60 ? (isAr() ? 'جيدة' : 'Good') : (isAr() ? 'تحتاج تحسين' : 'Needs work');
      const fill = el('mob-score-fill');
      const lbl = el('mob-score-label');
      if (fill) {
        fill.style.width = `${pct}%`;
        fill.style.background = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
      }
      if (lbl) lbl.textContent = `${isAr() ? 'جودة السيرة' : 'Resume quality'}: ${pct}% (${label})`;
    } catch(e) {}
  }


  // ─── VERIFIED CERTIFICATES / LICENSES ───
  function buildCertificatesForm() {
    const certs = career.certificates || [];
    const items = certs.map((c, i) => `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${h(c.name || (isAr() ? 'شهادة أو ترخيص' : 'Credential'))}</span>
          <div>
            <button class="list-item-btn" onclick="Editor.duplicateCertificateItem(${i})" title="Duplicate"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>
            <button class="list-item-del" onclick="Editor.deleteCertificateItem(${i})" title="Delete">✕</button>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-field form-field-full">
            <label class="form-label">${isAr() ? 'اسم الشهادة أو الترخيص' : 'Certificate / License name'}</label>
            <input class="form-input" id="f-cert-name-${i}" type="text" placeholder="${isAr() ? 'مثال: CMA — الجزء الأول' : 'e.g. CMA — Part 1'}" value="${a(c.name || '')}">
          </div>
          <div class="form-field">
            <label class="form-label">${isAr() ? 'الجهة المانحة' : 'Issuer'}</label>
            <input class="form-input" id="f-cert-issuer-${i}" type="text" placeholder="${isAr() ? 'الجهة الرسمية فقط' : 'Official issuer'}" value="${a(c.issuer || '')}">
          </div>
          <div class="form-field">
            <label class="form-label">${isAr() ? 'السنة / الحالة' : 'Year / status'}</label>
            <input class="form-input" id="f-cert-year-${i}" type="text" placeholder="${isAr() ? '2025 أو قيد الدراسة' : '2025 or In progress'}" value="${a(c.year || '')}">
          </div>
          <div class="form-field form-field-full">
            <label class="form-label">${isAr() ? 'رابط التحقق (اختياري)' : 'Verification URL (optional)'}</label>
            <input class="form-input" id="f-cert-url-${i}" type="url" placeholder="https://..." value="${a(c.url || '')}">
          </div>
        </div>
      </div>`).join('');
    return `
      <div class="coach-inline-note">${isAr() ? 'أضف فقط الشهادات والتراخيص التي حصلت عليها أو اذكر بوضوح أنها قيد الدراسة. لن يضيف المساعد شهادة من تلقاء نفسه.' : 'Only list credentials you actually hold, or clearly mark them as in progress. The coach will never claim a credential for you.'}</div>
      <div id="cert-list">${items || `${emptyStateSVG()}<p class="edit-empty" style="text-align:center">${isAr() ? 'لا توجد شهادات موثقة بعد.' : 'No verified credentials yet.'}</p>`}</div>
      <button class="btn-add-item" onclick="Editor.addCertificateItem()">${isAr() ? '+ إضافة شهادة أو ترخيص' : '+ Add certificate or license'}</button>`;
  }

  function collectCertificates() {
    const certs = career.certificates || [];
    certs.forEach((c, i) => {
      c.name = el(`f-cert-name-${i}`)?.value ?? c.name;
      c.issuer = el(`f-cert-issuer-${i}`)?.value ?? c.issuer;
      c.year = el(`f-cert-year-${i}`)?.value ?? c.year;
      c.url = el(`f-cert-url-${i}`)?.value ?? c.url;
    });
    career.certificates = certs;
  }
  function addCertificateItem() { pushUndo(); career.certificates = career.certificates || []; career.certificates.push({ name:'', issuer:'', year:'', url:'' }); openEditPanel('certificates'); }
  function duplicateCertificateItem(idx) { pushUndo(); career.certificates.splice(idx + 1, 0, JSON.parse(JSON.stringify(career.certificates[idx]))); saveAndRender(); openEditPanel('certificates'); }
  function deleteCertificateItem(idx) { pushUndo(); career.certificates.splice(idx, 1); saveAndRender(); openEditPanel('certificates'); }

  // ─── AWARDS ───
  function buildAwardsForm() {
    const awards = career.awards || [];
    const items = awards.map((award, i) => `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${h(award.name || (isAr() ? 'جائزة أو تقدير' : 'Award'))}</span>
          <div>
            <button class="list-item-btn" onclick="Editor.duplicateAwardItem(${i})" title="Duplicate"><svg viewBox="0 0 24 24"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg></button>
            <button class="list-item-del" onclick="Editor.deleteAwardItem(${i})" title="Delete">✕</button>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-field form-field-full"><label class="form-label">${isAr() ? 'اسم الجائزة' : 'Award name'}</label><input class="form-input" id="f-award-name-${i}" value="${a(award.name || '')}"></div>
          <div class="form-field"><label class="form-label">${isAr() ? 'الجهة' : 'Issuer'}</label><input class="form-input" id="f-award-issuer-${i}" value="${a(award.issuer || '')}"></div>
          <div class="form-field"><label class="form-label">${isAr() ? 'السنة' : 'Year'}</label><input class="form-input" id="f-award-year-${i}" value="${a(award.year || '')}"></div>
          <div class="form-field form-field-full"><label class="form-label">${isAr() ? 'وصف مختصر' : 'Short description'}</label><textarea class="form-textarea" id="f-award-desc-${i}" rows="3">${h(award.description || '')}</textarea></div>
        </div>
      </div>`).join('');
    return `<div id="award-list">${items || `${emptyStateSVG()}<p class="edit-empty" style="text-align:center">${isAr() ? 'لا توجد جوائز بعد.' : 'No awards yet.'}</p>`}</div><button class="btn-add-item" onclick="Editor.addAwardItem()">${isAr() ? '+ إضافة جائزة' : '+ Add award'}</button>`;
  }
  function collectAwards() {
    const awards = career.awards || [];
    awards.forEach((award, i) => {
      award.name = el(`f-award-name-${i}`)?.value ?? award.name;
      award.issuer = el(`f-award-issuer-${i}`)?.value ?? award.issuer;
      award.year = el(`f-award-year-${i}`)?.value ?? award.year;
      award.description = el(`f-award-desc-${i}`)?.value ?? award.description;
    });
    career.awards = awards;
  }
  function addAwardItem() { pushUndo(); career.awards = career.awards || []; career.awards.push({ name:'', issuer:'', year:'', description:'' }); openEditPanel('awards'); }
  function duplicateAwardItem(idx) { pushUndo(); career.awards.splice(idx + 1, 0, JSON.parse(JSON.stringify(career.awards[idx]))); saveAndRender(); openEditPanel('awards'); }
  function deleteAwardItem(idx) { pushUndo(); career.awards.splice(idx, 1); saveAndRender(); openEditPanel('awards'); }

  // ─────────────────────────────────────────────────
  // GALLERY
  // ─────────────────────────────────────────────────
  function openGallery() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
    const effective = TemplateSelector.getEffectiveTemplateId(career);
    overlay.innerHTML = `<div class="modal-box template-gallery-modal" dir="${isAr() ? 'rtl' : 'ltr'}">
      <div class="modal-header"><div><h3>${isAr() ? 'اختر قالب السيرة' : 'Choose a resume template'}</h3><p>${isAr() ? 'خمسة قوالب مصقولة بدل عدد كبير من الخيارات المتشابهة. يمكنك تغيير اللون والخط بعد الاختيار.' : 'Five polished choices instead of many similar options. Colors and fonts stay customizable.'}</p></div><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
      <div class="template-gallery-grid">${featuredTemplateIds().map(id => {
        const meta = TEMPLATE_PRESENTATION[id];
        const copy = meta[isAr() ? 'ar' : 'en'];
        const badge = isAr() ? meta.badgeAr : meta.badgeEn;
        return `<button type="button" class="template-gallery-card ${effective === id ? 'active' : ''}" onclick="Editor.pickGalleryTemplate('${id}'); this.closest('.modal-overlay').remove()">
          ${badge ? `<span class="template-badge">${h(badge)}</span>` : ''}
          <span class="template-gallery-preview">${templatePreviewMarkup(id)}</span>
          <strong>${h(copy[0])}</strong><small>${h(copy[1])}</small>
          <span class="template-select-label">${effective === id ? (isAr() ? 'القالب الحالي' : 'Current template') : (isAr() ? 'استخدام القالب' : 'Use template')}</span>
        </button>`;
      }).join('')}</div>
    </div>`;
    document.body.appendChild(overlay);
  }

  function pickGalleryTemplate(id) { setTemplate(id); }

  // ─────────────────────────────────────────────────
  // PREVIEW
  // ─────────────────────────────────────────────────
  function renderPreview() {
    const frame = el('preview-frame');
    if (!frame) return;
    requestAnimationFrame(() => {
      frame.innerHTML = CVRenderer.renderBody(career);
      if (currentMobileView === 'preview') {
        requestAnimationFrame(() => applyMobileScale());
      }
    });
  }

  const debouncedRenderPreview = debounce(() => renderPreview(), 180);
  function triggerLivePreview() { debouncedRenderPreview(); }

  // ─────────────────────────────────────────────────
  // ZOOM
  // ─────────────────────────────────────────────────
  function handleZoomSelect(val) {
    career.meta.zoomLevel = val;
    CareerStorage.save(career);
    
    if (val === 'fit-page') {
      fitPage();
    } else if (val === 'fit-width') {
      fitWidth();
    } else {
      setZoom(parseInt(val, 10));
    }
  }

  function setZoom(pct) {
    currentZoom = Math.max(50, Math.min(200, pct));
    const wrapper = el('a4-wrapper');
    if (wrapper) wrapper.style.transform = `scale(${currentZoom / 100})`;
  }

  function fitPage() {
    const canvas = el('editor-canvas');
    const wrapper = el('a4-wrapper');
    if (!canvas || !wrapper) return;
    // A4 ratio is ~1.414. Let's fit height
    const canvasH = canvas.clientHeight - 80;
    const paperH = 1123; 
    const fit = Math.floor((canvasH / paperH) * 100);
    setZoom(fit);
  }

  function fitWidth() {
    const canvas = el('editor-canvas');
    const wrapper = el('a4-wrapper');
    if (!canvas || !wrapper) return;
    const canvasW = canvas.clientWidth - 80;
    const paperW = 794; 
    const fit = Math.floor((canvasW / paperW) * 100);
    setZoom(fit);
  }

  // ─────────────────────────────────────────────────
  // UNDO / REDO
  // ─────────────────────────────────────────────────
  function pushUndo() {
    undoStack.push(JSON.stringify(career));
    if (undoStack.length > 50) undoStack.shift();
    redoStack = [];
  }

  function undoAction() {
    if (undoStack.length === 0) return;
    redoStack.push(JSON.stringify(career));
    career = CareerNormalize.normalize(JSON.parse(undoStack.pop()));
    saveAndRender();
    showSaveIndicator(t('ed.undo', 'Undone'));
  }

  function redoAction() {
    if (redoStack.length === 0) return;
    undoStack.push(JSON.stringify(career));
    career = CareerNormalize.normalize(JSON.parse(redoStack.pop()));
    saveAndRender();
    showSaveIndicator(t('ed.redo', 'Redone'));
  }

  // ─────────────────────────────────────────────────
  // AUTOSAVE
  // ─────────────────────────────────────────────────
  function saveAndRender() {
    showSaveIndicator(t('ed.saving', 'Saving...'));
    try {
      career = CareerStorage.save(career);
    } catch (error) {
      const ind = el('save-indicator');
      if (ind) {
        ind.textContent = isAr() ? 'لم يتم الحفظ' : 'Not saved';
        ind.className = 'save-indicator save-error';
      }
      showNoticeModal({
        title: isAr() ? 'تعذر حفظ السيرة' : 'Resume could not be saved',
        body: error?.message || (isAr() ? 'نزّل نسخة احتياطية وحاول تفريغ مساحة المتصفح.' : 'Download a backup and free browser storage space.')
      });
      return false;
    }
    renderAll();
    updateMobScoreBar();
    updateTopbarName();
    updateDataSafetyBanner();

    const saveBtn = el('edit-save-btn');
    if (saveBtn && el('edit-overlay').style.display !== 'none') {
      saveBtn.textContent = isAr() ? 'تم الحفظ ✓' : 'Saved ✓';
      saveBtn.style.background = '#16a34a';
    }

    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => showSaveIndicator(t('ed.saved', 'Saved ✓'), true), 400);
    return true;
  }

  function showSaveIndicator(msg, fade = false) {
    const ind = el('save-indicator');
    if (!ind) return;
    ind.textContent = msg;
    ind.className = 'save-indicator ' + (fade ? 'saved' : 'saving');
    if (fade) {
      ind.style.color = '#10b981';
      ind.style.background = '#f0fdf4';
      ind.style.borderColor = '#bbf7d0';
      setTimeout(() => {
        ind.textContent = isAr() ? 'تم الحفظ' : 'Saved';
        ind.className = 'save-indicator saved';
      }, 2500);
    } else {
      ind.style.color = '#3b82f6';
      ind.style.background = '#eff6ff';
      ind.style.borderColor = '#bfdbfe';
    }
  }

  // ─────────────────────────────────────────────────
  // AI ACTIONS
  // ─────────────────────────────────────────────────
  function setAILoading(state) {
    isAILoading = state;
    const overlay = el('edit-overlay');
    if(overlay) overlay.style.cursor = state ? 'wait' : 'default';
  }

  async function aiImprove(section, instruction) {
    if (isAILoading) return;
    collectFormData(section);
    if (section === 'summary') {
      try {
        setAILoading(true);
        let improved = null;
        if (typeof AIClient !== 'undefined' && AIClient.configured()) {
          improved = await AIClient.improveText(
            career,
            career.professionalSummary || '',
            instruction || 'Improve this professional summary for a CV.'
          );
        }
        if (!improved) {
          const r = ContentImprover.improve(career.professionalSummary || '', {});
          improved = r.improved;
        }
        if (improved && improved.trim() && improved.trim() !== (career.professionalSummary || '').trim()) {
          const draft = JSON.parse(JSON.stringify(career));
          draft.professionalSummary = improved.trim();
          showSmartFixPreviewModal(
            draft,
            career.professionalSummary || '',
            draft.professionalSummary,
            isAr() ? 'راجع النبذة قبل اعتمادها' : 'Review the improved summary',
            isAr() ? 'تم اعتماد النبذة المقترحة' : 'Summary wording applied'
          );
        } else {
          showNoticeModal({
            title: isAr() ? 'اكتب حقائق أكثر أولاً' : 'Add more factual detail first',
            body: isAr() ? 'أضف المسمى المستهدف وخبرتك أو مهاراتك المؤكدة، ثم سيبني المساعد نبذة أقوى بدون اختراع معلومات.' : 'Add your target title, experience, or verified skills first, then the coach can build a stronger summary without inventing facts.'
          });
        }
      } catch (e) {
        showAIError(e);
      } finally {
        setAILoading(false);
      }
      return;
    }

    if (section === 'experience') {
      try {
        setAILoading(true);
        const draft = JSON.parse(JSON.stringify(career));
        let applied = false;
        if (typeof AIClient !== 'undefined' && AIClient.configured()) {
          const improved = await AIClient.improveBullets(draft);
          if (Array.isArray(improved)) {
            improved.forEach((item, index) => {
              if (draft.experience?.[index] && Array.isArray(item.bullets)) {
                draft.experience[index].bullets = item.bullets;
                draft.experience[index].rawDescription = item.bullets.join('\n');
                applied = true;
              }
            });
          }
        }
        if (!applied) {
          const actionStarters = isAr()
            ? ['نفذت', 'راجعت', 'نسقت', 'تابعت']
            : ['Delivered', 'Reviewed', 'Coordinated', 'Managed'];
          (draft.experience || []).forEach(entry => {
            const raw = (entry.bullets || []).filter(Boolean).length
              ? (entry.bullets || []).filter(Boolean)
              : String(entry.rawDescription || '').split(/\n+|(?<=[.!؟])\s+/).map(item => item.trim()).filter(Boolean);
            if (!raw.length) return;
            entry.bullets = raw.slice(0, 4).map((bullet, bulletIndex) => {
              let text = String(bullet || '').trim().replace(/^[•\-–—]+\s*/, '').replace(/^(لقد|I have)\s+/i, '');
              if (!text) return '';
              const weak = isAr() ? /^(مسؤول عن|كنت مسؤولاً عن|قمت ب|ساعدت في|عملت على)\s*/i : /^(responsible for|helped with|worked on|tasked with|assisted with)\s*/i;
              if (weak.test(text)) text = `${actionStarters[bulletIndex % actionStarters.length]} ${text.replace(weak, '').trim()}`;
              if (!/[.!؟]$/.test(text)) text += '.';
              return text;
            }).filter(Boolean);
            entry.rawDescription = entry.bullets.join('\n');
          });
          applied = JSON.stringify(draft.experience) !== JSON.stringify(career.experience);
          if (!applied) {
            showNoticeModal({
              title: isAr() ? 'أضف تفاصيل حقيقية أولاً' : 'Add factual detail first',
              body: isAr() ? 'اكتب نقطتين على الأقل عن المهام أو النتائج التي نفذتها فعلاً، ثم سيحسن المساعد الصياغة بدون اختراع معلومات.' : 'Add at least two factual responsibilities or outcomes, then the assistant can improve the wording without inventing details.'
            });
          }
        }
        if (applied) {
          showSmartFixPreviewModal(
            draft,
            extractSectionTextForCompare(career, 'weak-experience'),
            extractSectionTextForCompare(draft, 'weak-experience'),
            isAr() ? 'راجع تحسين الخبرة قبل اعتماده' : 'Review experience improvements',
            isAr() ? '✓ تم اعتماد تحسين الخبرة' : '✓ Experience improvements applied'
          );
        }
      } catch (e) {
        showAIError(e);
      } finally {
        setAILoading(false);
      }
    }
  }
  async function aiShorten(section) {
    if (isAILoading) return;
    if (section === 'summary') {
      try {
        setAILoading(true);
        const current = career.professionalSummary || '';
        const shortened = current.split(' ').slice(0, Math.floor(current.split(' ').length * 0.7)).join(' ');
        if (shortened && shortened.trim() && shortened.trim() !== current.trim()) {
          const draft = JSON.parse(JSON.stringify(career));
          draft.professionalSummary = shortened.trim();
          showSmartFixPreviewModal(
            draft,
            current,
            draft.professionalSummary,
            isAr() ? 'راجع النسخة المختصرة' : 'Review the shorter version',
            isAr() ? 'تم اعتماد النسخة المختصرة' : 'Shorter summary applied'
          );
        }
      } catch (e) {
        showAIError(e);
      } finally {
        setAILoading(false);
      }
    }
  }
  function aiProfessional(section) {
    aiImprove(section, 'Rewrite this CV section in a polished, professional tone without adding fake details.');
  }
  async function aiTranslate(section) {
    if (isAILoading) return;
    collectFormData(section);
    if (section !== 'summary') {
      showNoticeModal({
        title: isAr() ? 'الترجمة دلوقتي للنبذة بس' : 'Translation is available for the summary',
        body: isAr() ? 'افتح النبذة المهنية وجرب الترجمة هناك. باقي الأقسام هنظبطها خطوة خطوة.' : 'Open the professional summary and translate it there. Other sections will stay focused for now.'
      });
      return;
    }
    try {
      setAILoading(true);
      const current = career.professionalSummary || '';
      const target = career.meta?.locale === 'ar' ? 'English' : 'Arabic';
      let translated = null;
      if (typeof AIClient !== 'undefined' && AIClient.configured()) {
        translated = await AIClient.improveText(
          career,
          current,
          `Translate this CV summary to ${target}. Keep it professional and do not add new facts.`
        );
      }
      if (!translated) {
        if (typeof ContentPicker !== 'undefined' && ContentPicker.getKnowledge) {
          const field = currentField();
          const targetLocale = isAr() ? 'en' : 'ar';
          const kb = await ContentPicker.getKnowledge(targetLocale, field);
          if (kb && kb.professional_summaries && kb.professional_summaries.length > 0) {
            const sumObj = kb.professional_summaries[0];
            translated = typeof sumObj === 'string' ? sumObj : (sumObj.text || sumObj.en || sumObj.ar);
          }
        }
        if (!translated) {
          translated = isAr()
            ? "Dedicated professional with proven experience in achieving results, managing projects efficiently, and contributing to team success."
            : "محترف مكرس ذو خبرة مثبتة في تحقيق النتائج وإدارة المشاريع بكفاءة والمساهمة في نجاح الفريق.";
        }
      }
      if (await showDecisionModal({
        title: isAr() ? 'ترجمة جاهزة' : 'Translation ready',
        body: translated,
        confirmText: isAr() ? 'طبق الترجمة' : 'Apply translation',
        cancelText: isAr() ? 'إلغاء' : 'Cancel'
      })) {
        pushUndo(); career.professionalSummary = translated; saveAndRender(); openEditPanel('summary');
      }
    } catch (e) {
      showAIError(e);
    } finally {
      setAILoading(false);
    }
  }
  function showSkillSelectionModal(skills) {
    return new Promise(resolve => {
      const old = el('skill-selection-modal');
      if (old) old.remove();
      const modal = document.createElement('div');
      modal.id = 'skill-selection-modal';
      modal.className = 'modal-overlay';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-card skill-selection-card" dir="${isAr() ? 'rtl' : 'ltr'}">
          <div class="modal-header"><div><h3>${isAr() ? 'اختر فقط المهارات التي تمتلكها فعلاً' : 'Select only skills you genuinely have'}</h3><p>${isAr() ? 'هذه اقتراحات شائعة في المجال وليست معلومات مؤكدة عنك.' : 'These are common role suggestions, not verified facts about you.'}</p></div></div>
          <div class="skill-selection-list">
            ${skills.map((skill, index) => `<label class="skill-selection-item"><input type="checkbox" value="${a(skill)}"><span>${h(skill)}</span></label>`).join('')}
          </div>
          <div class="modal-actions">
            <button class="btn-secondary" id="skill-selection-cancel">${isAr() ? 'إلغاء' : 'Cancel'}</button>
            <button class="btn-primary" id="skill-selection-apply">${isAr() ? 'أضف المحدد فقط' : 'Add selected only'}</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      const finish = value => { modal.remove(); resolve(value); };
      el('skill-selection-cancel').onclick = () => finish([]);
      el('skill-selection-apply').onclick = () => finish(Array.from(modal.querySelectorAll('input:checked')).map(input => input.value));
      modal.onclick = event => { if (event.target === modal) finish([]); };
    });
  }

  async function aiSuggestSkills() {
    if (isAILoading) return;
    try {
      setAILoading(true);
      const field = career.careerProfile?.field || 'developer';
      const currentSkills = Object.values(career.skills || {}).flat();
      let suggested = null;
      if (typeof AIClient !== 'undefined' && AIClient.configured() && AIClient.suggestSkills) {
        suggested = await AIClient.suggestSkills(career);
      }
      if (!suggested || !suggested.length) {
        suggested = (typeof AICoach !== 'undefined'
          ? AICoach.suggestSkills(career, currentSkills)
          : OfflineHelpers.suggestSkills(field, '', currentSkills));
      }
      suggested = suggested.slice(0, 8);
      const selected = suggested.length ? await showSkillSelectionModal(suggested) : [];
      if (selected.length) {
        pushUndo();
        const category = career.meta?.locale === 'ar' ? 'المهارات المؤكدة' : 'Verified Skills';
        career.skills = career.skills || {};
        career.skills[category] = [...new Set([...(career.skills[category] || []), ...selected])];
        saveAndRender();
        if (currentEditSection === 'skills') openEditPanel('skills');
      }
    } catch(e) {
      showAIError(e);
    } finally {
      setAILoading(false);
    }
  }
  function handleAIAction(action) {
    if (isAILoading) return;
    switch (action) {
      case 'generate-summary':
      case 'auto-summary':
      case 'edit-summary':
        setAILoading(true);
        (async () => {
          let text = null;
          if (typeof AIClient !== 'undefined' && AIClient.configured()) {
            text = await AIClient.generateSummary(career);
          }
          if (!text) {
            const summary = await ContentPicker.getSummary(career);
            text = summary?.text || (typeof AICoach !== 'undefined' ? AICoach.buildFallbackSummary(career) : '');
          }
          if (text && text.trim()) {
            const draft = JSON.parse(JSON.stringify(career));
            draft.professionalSummary = text.trim();
            showSmartFixPreviewModal(
              draft,
              career.professionalSummary || '',
              draft.professionalSummary,
              isAr() ? 'راجع النبذة المقترحة' : 'Review the proposed summary',
              isAr() ? 'تم اعتماد النبذة' : 'Summary applied'
            );
          } else {
            showNoticeModal({
              title: isAr() ? 'بيانات غير كافية' : 'Not enough information',
              body: isAr() ? 'أكمل المسمى الوظيفي وأضف مهارات أو خبرة حقيقية أولاً حتى تكون النبذة مفيدة وصادقة.' : 'Complete your target title and add verified skills or experience first so the summary stays useful and factual.'
            });
          }
        })().catch(e => showAIError(e)).finally(() => setAILoading(false));
        break;
      case 'improve-summary': aiImprove('summary'); break;
      case 'shorten-summary': aiShorten('summary'); break;
      case 'translate-summary': aiTranslate('summary'); break;
      case 'suggest-skills':
      case 'auto-skills':
        aiSuggestSkills(); break;
      case 'tailor-job': tailorJob(); break;
      case 'edit-personal': openEditPanel('personalInfo'); break;
      case 'edit-skills': openEditPanel('skills'); break;
      case 'edit-experience': openEditPanel('experience'); break;
      case 'edit-education': openEditPanel('education'); break;
      case 'edit-projects': openEditPanel('projects'); break;
      case 'edit-certificates': openEditPanel('certificates'); break;
      case 'improve-bullets':
      case 'improve-experience':
      case 'auto-bullets':
        aiImprove('experience');
        break;
      case 'ats-check':
        showExportModal();
        break;
    }
  }

  // ─────────────────────────────────────────────────
  // EXPORT
  // ─────────────────────────────────────────────────
  function showExportModal() { el('export-modal').style.display = 'flex'; renderExportReview(); }
  function closeExportModal(event) {
    if (event && event.target !== el('export-modal')) return;
    el('export-modal').style.display = 'none';
  }
  function cssHref(path) {
    return new URL(path, window.location.origin).href;
  }

  function exportFilename(ext) {
    const name = career.personalInfo?.name?.trim() || 'cv';
    return name.replace(/[\\/:*?"<>|]+/g, '').replace(/\s+/g, '_') + ext;
  }

  function buildStandaloneCvHtml({ print = false } = {}) {
    const cvHtml = CVRenderer.renderBody(career);
    const name = career.personalInfo?.name || 'cv';
    const themePath = TemplateSelector.getThemeCssPath(TemplateSelector.getEffectiveThemeId(career));
    const lang = career.meta?.locale || 'en';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    return `<!DOCTYPE html>
<html lang="${a(lang)}" dir="${a(dir)}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${h(name)}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Cairo:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="${cssHref('/templates/shared/base.css')}">
  <link rel="stylesheet" href="${cssHref(TemplateSelector.getLayoutCssPath())}">
  <link rel="stylesheet" href="${cssHref(themePath)}">
  <style>
    html, body { margin: 0; padding: 0; background: #fff; }
    body { font-family: ${dir === 'rtl' ? "'Cairo', 'Segoe UI', Arial, sans-serif" : "'Inter', 'Segoe UI', Arial, sans-serif"}; }
    .cv-paper { margin: 0 auto; box-shadow: none !important; border-radius: 0 !important; }
    ${print ? '@page { size: A4; margin: 0; } @media print { body { margin: 0; } .cv-paper { width: 210mm !important; min-height: 297mm !important; } }' : ''}
  </style>
</head>
<body>${cvHtml}</body>
</html>`;
  }

  function waitForPrintAssets(doc) {
    const fontWait = doc.fonts?.ready || Promise.resolve();
    const images = Array.from(doc.images || []).map(image => image.complete
      ? Promise.resolve()
      : new Promise(resolve => { image.onload = image.onerror = resolve; }));
    return Promise.race([
      Promise.all([fontWait, ...images]),
      new Promise(resolve => setTimeout(resolve, 3500))
    ]);
  }

  function printCvOnly() {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '1px';
    iframe.style.height = '1px';
    iframe.style.border = '0';
    iframe.style.inset = '0';
    iframe.style.opacity = '0';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.onload = async () => {
      const win = iframe.contentWindow;
      if (!win) return;
      await waitForPrintAssets(win.document);
      win.focus();
      win.print();
      setTimeout(() => iframe.remove(), 1800);
    };
    iframe.srcdoc = buildStandaloneCvHtml({ print: true });
    document.body.appendChild(iframe);
  }

  async function exportPdf() {
    if (containsDemoData(career)) {
      showNoticeModal({
        title: isAr() ? 'راجع البيانات التجريبية قبل التصدير' : 'Replace sample data before exporting',
        body: isAr() ? 'وجدنا عبارات تبدو تجريبية أو عامة مثل شركة/جامعة غير حقيقية. استبدلها ببياناتك الفعلية أولاً لحماية مصداقيتك.' : 'We found text that looks like placeholder or sample data. Replace it with your real information before exporting.'
      });
      return;
    }
    if (typeof AICoach !== 'undefined') {
      const review = AICoach.getPreExportReview(career);
      if (review.blockers && !await showDecisionModal({
        title: isAr() ? 'لسه فيه حاجات محتاجة تتظبط' : 'A few important fixes remain',
        body: isAr() ? 'الأفضل نصلح الحاجات المتظللة الأول، عشان السيرة تطلع أقوى. تحب تطبعها رغم كده؟' : 'Fix the highlighted items first for a stronger resume. Export anyway?',
        confirmText: isAr() ? 'اطبع رغم كده' : 'Export anyway',
        cancelText: isAr() ? 'رجعني أظبطها' : 'Go back'
      })) {
        renderExportReview();
        return;
      }
    }
    closeExportModal();
    printCvOnly();
  }
  function exportJson() { CareerStorage.download(career, exportFilename('.json')); updateDataSafetyBanner(); }
  function exportHtml() {
    const full = buildStandaloneCvHtml();
    const blob = new Blob([full], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = exportFilename('.html');
    a.click(); URL.revokeObjectURL(url);
  }

  async function exportPng() {
    const frame = el('preview-frame');
    if (!frame) return;
    if (typeof html2canvas === 'undefined') {
      alert(isAr() ? 'مكتبة html2canvas غير محملة' : 'html2canvas library is not loaded');
      return;
    }
    try {
      const canvas = await html2canvas(frame, { scale: 2, useCORS: true });
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFilename('.png');
      a.click();
    } catch (err) {
      console.error('PNG export failed:', err);
      alert(isAr() ? 'حدث خطأ أثناء تصدير الصورة' : 'Error exporting PNG');
    }
  }

  function exportDocx() {
    if (typeof htmlDocx === 'undefined') {
      showNoticeModal({
        title: isAr() ? 'تصدير Word غير متاح الآن' : 'Word export is unavailable',
        body: isAr() ? 'لن ننشئ ملف .doc مزيفًا. استخدم PDF الآن أو أعد المحاولة بعد تحميل مكتبة DOCX.' : 'We will not create a fake .doc file. Use PDF or retry after the DOCX library loads.'
      });
      return;
    }
    try {
      const full = buildStandaloneCvHtml();
      const converted = htmlDocx.asBlob(full);
      const url = URL.createObjectURL(converted);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFilename('.docx');
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('DOCX export failed:', err);
      alert(isAr() ? 'حدث خطأ أثناء تصدير ملف الوورد' : 'Error exporting DOCX');
    }
  }

  async function tailorJob() {
    const jdText = await showInputModal({
      title: isAr() ? 'تخصيص السيرة لوظيفة محددة' : 'Tailor resume to a job',
      body: isAr()
        ? 'الصق إعلان الوظيفة الكامل. سنقارن الكلمات بالمحتوى الحقيقي في سيرتك، ولن نضيف أي مهارة قبل تأكيدك.'
        : 'Paste the full job description. We will compare it only with your actual resume content and will not add skills without confirmation.',
      placeholder: isAr() ? 'الصق إعلان الوظيفة هنا...' : 'Paste the job description here...'
    });
    if (!jdText || jdText.trim().length < 80) return;
    switchCoachTab('ats');
    const input = el('coach-jd-input');
    if (input) {
      input.value = jdText.trim();
      applyJDMatch();
    } else {
      const keywords = extractJDKeywords(jdText);
      const cvText = buildCvSearchText(career);
      const found = keywords.filter(keyword => cvText.includes(keyword));
      const missing = keywords.filter(keyword => !cvText.includes(keyword));
      career.meta = career.meta || {};
      career.meta.targetJD = jdText.trim();
      career.meta.jdMatchScore = keywords.length ? Math.round((found.length / keywords.length) * 100) : 0;
      career.meta.jdFoundKeywords = found.slice(0, 14);
      career.meta.jdMissingKeywords = missing.slice(0, 14);
      saveAndRender();
      switchCoachTab('ats');
    }
  }

  // ─────────────────────────────────────────────────
  // LEGACY SECTION EDIT SUPPORT (for outside callers)
  // ─────────────────────────────────────────────────
  function editSection(section) { openEditPanel(section); }
  function jumpTo(action) {
    if (action.startsWith('edit-')) openEditPanel(action.replace('edit-', ''));
  }

  function autoFillStarterCV() {
    const ordered = SECTION_DEFS.filter(s => shouldShowSection(s.key));
    const target = ordered.find(s => ['missing','warn'].includes(getSectionStatus(s.key))) || ordered[0];
    if (target) openEditPanel(target.key);
  }

  function setAccentColor(color) {
    if (!career.meta) career.meta = {};
    career.meta.accentColor = color;
    saveAndRender();
  }

  function setCvFont(fontFamily) {
    if (!career.meta) career.meta = {};
    career.meta.fontFamily = fontFamily;
    saveAndRender();
  }

  function togglePhoto(show) {
    if (!career.meta) career.meta = {};
    if (show && !career.personalInfo?.photo) {
      career.meta.showPhoto = false;
      showNoticeModal({
        title: isAr() ? 'أضف صورتك الحقيقية أولاً' : 'Add your real photo first',
        body: isAr() ? 'لن نستخدم صورة تجريبية. أضف رابط صورتك في البيانات الشخصية، ثم فعّل إظهار الصورة.' : 'We will not use a sample photo. Add your photo URL in Personal Info, then enable the photo.'
      });
      openEditPanel('personalInfo');
      return;
    }
    career.meta.showPhoto = !!show;
    saveAndRender();
  }

  function setSectionOrder(orderArray) {
    if (!career.meta) career.meta = {};
    career.meta.sectionOrder = orderArray;
    saveAndRender();
  }

  // ───────────────────────────────────────────────────────────────────────────
  // CAREER COACH — 3-Tab Redesign (Overview | Mentor | ATS)
  // ───────────────────────────────────────────────────────────────────────────

  function _ct(key, fallback) {
    return typeof I18n !== 'undefined' ? I18n.t(key, fallback) : fallback;
  }

  function _label(en, ar) {
    return isAr() ? ar : en;
  }


  function showAddSectionModal() {
    const keys = ['certificates','awards','projects','languages','education'];
    const descriptions = {
      certificates: isAr() ? 'شهادات مهنية أو تراخيص حصلت عليها فعلاً' : 'Verified certifications and licenses',
      awards: isAr() ? 'جوائز أو تقدير مهني له قيمة واضحة' : 'Relevant professional recognition',
      projects: isAr() ? 'مشروعات تثبت مهارتك ودورك والنتيجة' : 'Projects that prove your role and impact',
      languages: isAr() ? 'اللغة ومستوى الاستخدام الحقيقي' : 'Languages and honest proficiency levels',
      education: isAr() ? 'مؤهل إضافي أو دراسة أكاديمية' : 'Additional education or qualifications'
    };
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay'; overlay.style.display = 'flex';
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="modal-box add-section-modal" dir="${isAr() ? 'rtl' : 'ltr'}">
      <div class="modal-header"><div><h3>${isAr() ? 'إضافة قسم اختياري' : 'Add an optional section'}</h3><p>${isAr() ? 'أضف القسم فقط عندما توجد معلومات حقيقية تقوي السيرة.' : 'Add a section only when it contains real information that strengthens the resume.'}</p></div><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
      <div class="add-section-grid">${getSectionDefs().filter(def => keys.includes(def.key)).map(def => `<button type="button" class="add-section-card" onclick="Editor.openEditPanel('${def.key}'); this.closest('.modal-overlay').remove();"><span class="add-section-icon">${def.icon}</span><span><strong>${h(t(def.labelKey, def.defaultLabel))}</strong><small>${h(descriptions[def.key])}</small></span><i>＋</i></button>`).join('')}<button type="button" class="add-section-card custom" onclick="Editor.createCustomSection(); this.closest('.modal-overlay').remove();"><span class="add-section-icon"><svg class="icon-svg" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg></span><span><strong>${isAr() ? 'قسم مخصص' : 'Custom section'}</strong><small>${isAr() ? 'أنشئ قسمًا بعنوان وطريقة عرض من اختيارك' : 'Create your own title and display style'}</small></span><i>＋</i></button></div>
    </div>`;
    document.body.appendChild(overlay);
  }

  function createCustomSection() {
    career.customSections = career.customSections || [];
    const id = `custom_${Date.now()}`;
    career.customSections.push({ id, title: isAr() ? 'قسم مخصص' : 'Custom Section', type: 'bullets', content: '', visible: true });
    pushUndo();
    saveAndRender();
    openEditPanel(`custom:${id}`);
  }

  function deleteCustomSection(id) {
    showDecisionModal({
      title: isAr() ? 'حذف القسم المخصص؟' : 'Delete custom section?',
      body: isAr() ? 'سيتم حذف عنوان القسم ومحتواه من السيرة.' : 'The section title and content will be removed.',
      confirmText: isAr() ? 'حذف' : 'Delete',
      cancelText: isAr() ? 'إلغاء' : 'Cancel',
      tone: 'danger'
    }).then(confirmed => {
      if (!confirmed) return;
      pushUndo();
      career.customSections = (career.customSections || []).filter(section => String(section.id) !== String(id));
      saveAndRender(); closeEditPanel();
    });
  }

  function showVersionManagerModal() {
    el('version-manager-modal')?.remove();
    const versions = CareerStorage?.listVersions ? CareerStorage.listVersions() : [];
    const activeId = CareerStorage?.getActiveVersionId ? CareerStorage.getActiveVersionId() : 'default';
    const overlay = document.createElement('div');
    overlay.id = 'version-manager-modal'; overlay.className = 'modal-overlay'; overlay.style.display = 'flex';
    overlay.onclick = event => { if (event.target === overlay) overlay.remove(); };
    overlay.innerHTML = `<div class="modal-box version-modal-final" dir="${isAr() ? 'rtl' : 'ltr'}">
      <div class="modal-header"><div><h3>${isAr() ? 'نسخ مخصصة للوظائف' : 'Job-specific resume versions'}</h3><p>${isAr() ? 'ميزة اختيارية: احتفظ بسيرتك الأساسية وأنشئ نسخة عند التقديم لوظيفة مختلفة.' : 'Optional: keep a master resume and create a copy for a specific role.'}</p></div><button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button></div>
      <div class="version-create-row"><input id="new-version-name-input" type="text" placeholder="${isAr() ? 'مثال: محاسب أول — شركة التقنية' : 'e.g. Senior Accountant — Tech company'}"><button type="button" onclick="Editor.handleCreateVersion()">${isAr() ? 'إنشاء نسخة' : 'Create copy'}</button></div>
      <div class="version-list-final">${versions.map(version => {
        const active = version.id === activeId;
        return `<div class="version-row-final ${active ? 'active' : ''}"><div><strong>${h(version.name || (isAr() ? 'السيرة الأساسية' : 'Master resume'))}</strong><span>${active ? (isAr() ? 'مفتوحة الآن' : 'Open now') : new Date(version.updatedAt).toLocaleDateString(isAr() ? 'ar-EG' : 'en-US')}</span></div><div>${!active ? `<button type="button" onclick="Editor.handleSwitchVersion('${version.id}')">${isAr() ? 'فتح' : 'Open'}</button>` : ''}${!active && version.id !== 'default' ? `<button type="button" class="danger" onclick="Editor.handleDeleteVersion('${version.id}')">${isAr() ? 'حذف' : 'Delete'}</button>` : ''}</div></div>`;
      }).join('')}</div>
    </div>`;
    document.body.appendChild(overlay);
  }

  function handleCreateVersion() {
    const input = el('new-version-name-input');
    const name = input ? input.value.trim() : '';
    if (!name && !confirm('هل تريد إنشاء نسخة جديدة بالاسم الافتراضي؟')) return;
    if (typeof CareerStorage !== 'undefined' && CareerStorage.duplicateCareer) {
      pushUndo();
      const res = CareerStorage.duplicateCareer(name || (career.personalInfo?.name + ' - نسخة تخصيص'));
      career = res.career;
      saveAndRender();
      showSaveIndicator('✓ تم إنشاء النسخة الجديدة والانتقال إليها', true);
      showVersionManagerModal(); // Refresh modal
    }
  }

  function handleSwitchVersion(versionId) {
    if (typeof CareerStorage !== 'undefined' && CareerStorage.switchVersion) {
      pushUndo();
      career = CareerStorage.switchVersion(versionId);
      saveAndRender();
      showSaveIndicator('✓ تم الانتقال للنسخة المحددة', true);
      const modal = el('version-manager-modal');
      if (modal) modal.remove();
      if (typeof updateCoachPanel === 'function') updateCoachPanel();
    }
  }

  function handleDeleteVersion(versionId) {
    if (!confirm('هل أنت متأكد من حذف هذه النسخة نهائياً؟')) return;
    if (typeof CareerStorage !== 'undefined' && CareerStorage.deleteVersion) {
      const ok = CareerStorage.deleteVersion(versionId);
      if (ok) {
        showSaveIndicator('✓ تم حذف النسخة', true);
        showVersionManagerModal(); // Refresh modal
      }
    }
  }

  function switchCoachTab(tab) {
    ['overview', 'mentor', 'ats'].forEach(t => {
      const btn = el('coach-tab-' + t);
      const pane = el('coach-pane-' + t);
      if (btn) btn.classList.toggle('active', t === tab);
      if (pane) pane.classList.toggle('active', t === tab);
    });
    const _ins = typeof AICoach !== 'undefined' ? AICoach.buildCoachInsights(career) : null;
    if (!_ins) return;
    if (tab === 'overview') renderCoachOverview(_ins);
    else if (tab === 'mentor') renderCoachMentor(_ins);
    else if (tab === 'ats') renderCoachATS(_ins);
  }

  function renderCoachOverview(ins) {
    const panel = el('coach-overview-panel');
    if (!panel) return;
    const isRtl = document.documentElement.dir === 'rtl' || (typeof I18n !== 'undefined' && I18n.getLocale() === 'ar');
    const scoreColor = ins.score >= 80 ? '#16a34a' : ins.score >= 60 ? '#d97706' : '#dc2626';

    let html = '<div style="background: linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%); color: #fff; padding: 16px; border-radius: 12px; margin-bottom: 16px; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);">'
      + '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">'
      + '<span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 20px;">' + _ct('coach.overview.today_goal', 'هدف اليوم') + '</span>'
      + '<span style="font-size: 11px; font-weight: 700; opacity: 0.9;">' + _ct('coach.overview.remaining', 'المتبقي') + ': ' + ins.todayGoal.remainingTasksCount + ' ' + _ct('coach.overview.tasks', 'مهام') + '</span>'
      + '</div>'
      + '<div style="font-size: 14px; font-weight: 800; line-height: 1.4; margin-bottom: 10px;">'
      + (ins.todayGoal.remainingTasksCount
        ? _ct('coach.overview.session_goal', 'ابدأ بأهم {count} تحسينات في هذه الجلسة').replace('{count}', ins.todayGoal.remainingTasksCount)
        : _ct('coach.overview.session_done', 'الأساسيات مكتملة — راجع التفاصيل قبل التصدير'))
      + '</div>'
      + '<div style="height: 6px; background: rgba(255,255,255,0.2); border-radius: 3px; overflow: hidden;">'
      + '<div style="height: 100%; width: ' + ins.todayGoal.currentScore + '%; background: #22c55e; border-radius: 3px; transition: width 0.4s;"></div>'
      + '</div></div>';

    html += '<div style="margin-bottom:16px;">'
      + '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px;">' + _ct('coach.overview.score','Resume Score') + '</div>'
      + '<div style="display:flex;align-items:baseline;gap:8px;margin-bottom:8px;">'
      + '<span style="font-size:32px;font-weight:900;line-height:1;color:#0f172a;">' + ins.score + '%</span>'
      + '<span style="font-size:12px;font-weight:700;color:' + scoreColor + ';background:' + scoreColor + '20;padding:2px 8px;border-radius:12px;">' + h(ins.scoreLabel) + '</span>'
      + '</div>'
      + '<div style="height:6px;background:#e2e8f0;border-radius:3px;overflow:hidden;">'
      + '<div style="height:100%;width:' + ins.score + '%;background:' + scoreColor + ';border-radius:3px;transition:width 0.4s;"></div>'
      + '</div></div>';

    if (ins.top3Problems && ins.top3Problems.length > 0) {
      html += '<div style="margin-bottom:16px;">'
        + '<div style="font-size:11px;font-weight:800;color:#475569;text-transform:uppercase;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">'
        + '<span>↗ ' + _ct('coach.overview.top_problems', 'أهم 3 أولويات للتحسين') + '</span>'
        + '</div>'
        + ins.top3Problems.map(function(p, idx) {
          const high = p.severity === 'high';
          const tone = high
            ? { border: '#fecaca', soft: '#fef2f2', text: '#b91c1c', accent: '#dc2626' }
            : { border: '#bfdbfe', soft: '#eff6ff', text: '#1e40af', accent: '#2563eb' };
          return '<div style="background:#fff;border:1px solid ' + tone.border + ';border-radius:10px;padding:12px;margin-bottom:10px;box-shadow:0 2px 8px rgba(15,23,42,0.04);">'
            + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">'
            + '<div style="font-size:13px;font-weight:800;color:' + tone.text + ';display:flex;align-items:center;gap:6px;">'
            + '<span style="background:' + tone.soft + ';color:' + tone.accent + ';width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">' + (idx + 1) + '</span>'
            + '<span>' + h(p.title) + '</span>'
            + '</div>'
            + (p.impactLabel ? '<span style="font-size:10px;font-weight:800;color:#475569;background:#f1f5f9;padding:3px 7px;border-radius:10px;flex-shrink:0;">' + h(p.impactLabel) + '</span>' : '')
            + '</div>'
            + '<div style="font-size:12px;color:#475569;margin-bottom:8px;line-height:1.4;">' + h(p.detail) + '</div>'
            + (p.why ? '<div style="background:#f8fafc;border-left:' + (isRtl ? 'none' : '3px solid #94a3b8') + ';border-right:' + (isRtl ? '3px solid #94a3b8' : 'none') + ';padding:8px 10px;border-radius:6px;font-size:11px;color:#334155;line-height:1.4;margin-bottom:10px;"><strong style="color:#0f172a;">💡 ' + _ct('coach.overview.why', 'لماذا؟') + '</strong> ' + h(p.why) + '</div>' : '')
            + '<button style="width:100%;background:#2563eb;color:#fff;border:none;border-radius:7px;padding:9px 12px;font-size:12px;font-weight:800;cursor:pointer;transition:background 0.15s;display:flex;align-items:center;justify-content:center;gap:6px;" onmouseover="this.style.background=\'#1d4ed8\'" onmouseout="this.style.background=\'#2563eb\'" onclick="Editor.triggerSmartFix(\'' + h(p.fixAction || 'edit-personal') + '\', \'' + h(p.sectionKey) + '\', \'' + h(p.id) + '\')">'
            + (p.actionLabel || _ct('coach.overview.smart_fix', 'تحسين الآن'))
            + '</button>'
            + '</div>';
        }).join('') + '</div>';
    }

    if (ins.recommended.length > 0) {
      html += '<div style="margin-bottom:16px;">'
        + '<div style="font-size:10px;font-weight:700;color:#0ea5e9;text-transform:uppercase;margin-bottom:8px;border-bottom:1px solid #bae6fd;padding-bottom:4px;">' + _ct('coach.overview.recommended','Recommended') + '</div>'
        + ins.recommended.map(function(r) {
          return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;cursor:pointer;" onclick="Editor.openEditPanel(\'' + r.sectionKey + '\')">'
            + '<span style="color:#0ea5e9;font-weight:700;">→</span>'
            + '<span style="font-size:12px;color:#334155;">' + h(r.title) + '</span>'
            + '</div>';
        }).join('') + '</div>';
    }

    if (ins.completed.length > 0) {
      html += '<div>'
        + '<div style="font-size:10px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:8px;border-bottom:1px solid #bbf7d0;padding-bottom:4px;">' + _ct('coach.overview.completed','Completed') + '</div>'
        + ins.completed.map(function(c) {
          return '<div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">'
            + '<span style="color:#16a34a;">✓</span>'
            + '<span style="font-size:12px;color:#475569;text-decoration:line-through;">' + h(c.title) + '</span>'
            + '</div>';
        }).join('') + '</div>';
    }
    panel.innerHTML = html;
  }

  function renderCoachMentor(ins) {
    const panel = el('coach-mentor-panel');
    if (!panel) return;
    const m = ins.mentor;
    const isRtl = document.documentElement.dir === 'rtl' || (typeof I18n !== 'undefined' && I18n.getLocale() === 'ar');
    let html = '<div style="margin-bottom:20px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:12px;padding:16px;">'
      + '<div style="font-size:13px;font-weight:800;color:#1e40af;margin-bottom:8px;">' + h(m.headline) + '</div>';

    if (m.bestStep) {
      html += '<div style="background:#fff;border:1px solid #93c5fd;border-radius:8px;padding:10px;margin-bottom:10px;">'
        + '<div style="font-size:12px;font-weight:800;color:#1d4ed8;margin-bottom:4px;">📌 ' + h(m.bestStep) + '</div>'
        + (m.why ? '<div style="font-size:11px;color:#3b82f6;line-height:1.4;"><strong>' + _ct('coach.overview.why', 'لماذا؟') + '</strong> ' + h(m.why) + '</div>' : '')
        + '</div>';
    } else if (m.explanation) {
      html += '<div style="font-size:13px;color:#1e3a8a;line-height:1.5;margin-bottom:12px;">' + h(m.explanation) + '</div>';
    }

    if (m.nextSteps && m.nextSteps.length > 0) {
      html += '<div style="font-size:11px;font-weight:700;color:#3b82f6;text-transform:uppercase;margin-bottom:8px;">' + _ct('coach.mentor.next_steps','Next Steps:') + '</div>';
      m.nextSteps.forEach(function(step, i) {
        html += '<div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:6px;">'
          + '<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;color:#fff;font-size:10px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0;margin-top:2px;">' + (i+1) + '</div>'
          + '<div style="font-size:12px;color:#1d4ed8;line-height:1.4;">' + h(step) + '</div>'
          + '</div>';
      });
    }
    html += '</div>';

    if (m.quickActions && m.quickActions.length > 0) {
      html += '<div style="font-size:10px;font-weight:700;color:#64748b;text-transform:uppercase;margin-bottom:10px;letter-spacing:0.5px;">' + _ct('coach.mentor.quick_actions','Quick Actions') + '</div>'
        + '<div style="display:flex;flex-direction:column;gap:8px;">'
        + m.quickActions.map(function(act) {
          return '<button style="width:100%;padding:10px 12px;background:#fff;border:1px solid #e2e8f0;border-radius:8px;font-size:13px;font-weight:600;color:#334155;text-align:' + (isRtl ? 'right' : 'left') + ';cursor:pointer;transition:all 0.15s;"'
            + ' onmouseover="this.style.borderColor=\'#94a3b8\';this.style.background=\'#f8fafc\';"'
            + ' onmouseout="this.style.borderColor=\'#e2e8f0\';this.style.background=\'#fff\';"'
            + ' onclick="Editor.handleAIAction(\'' + act.id + '\')">' + h(act.label) + '</button>';
        }).join('') + '</div>';
    }
    panel.innerHTML = html;
  }

  function renderCoachATS(ins) {
    const panel = el('coach-ats-panel');
    if (!panel) return;
    const ats = ins.ats;
    const isRtl = document.documentElement.dir === 'rtl' || (typeof I18n !== 'undefined' && I18n.getLocale() === 'ar');
    const modeLabel = ats.mode === 'job_match' ? _ct('coach.ats.job_match','Job Match') : _ct('coach.ats.readiness','ATS Readiness');

    let html = '<div style="margin-bottom:16px;">'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">'
      + '<div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:1px;">' + modeLabel + '</div>'
      + (ats.mode === 'job_match' ? '<button style="background:none;border:none;color:#dc2626;font-size:11px;font-weight:700;cursor:pointer;padding:2px 6px;" onclick="Editor.clearJDMatch()">✕ ' + _ct('coach.ats.clear_jd', 'مسح التخصيص') + '</button>' : '')
      + '</div>';

    if (ats.mode === 'job_match') {
      const matchColor = ats.score >= 80 ? '#16a34a' : ats.score >= 60 ? '#d97706' : '#dc2626';
      html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px;margin-bottom:16px;text-align:center;">'
        + '<div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:4px;">' + _ct('coach.ats.match_score', 'نسبة مطابقة إعلان الوظيفة (JD)') + '</div>'
        + '<div style="font-size:36px;font-weight:900;color:' + matchColor + ';">' + ats.score + '%</div>'
        + '<div style="font-size:10px;color:#64748b;line-height:1.4;margin-top:5px;">' + h(ats.disclaimer || '') + '</div>'
        + '<div style="font-size:10px;color:#475569;margin-top:7px;">' + _ct('coach.ats.readiness_also','جاهزية ملفك للقراءة الآلية:') + ' <strong>' + (ats.readinessScore || 0) + '%</strong></div>'
        + '</div>';

      if (ats.missingKeywords.length > 0) {
        html += '<div style="margin-bottom:16px;">'
          + '<div style="font-size:11px;font-weight:700;color:#dc2626;margin-bottom:8px;">' + _ct('coach.ats.missing_jd_kw', 'كلمات مفتاحية مفقودة من إعلان الوظيفة:') + '</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:6px;">'
          + ats.missingKeywords.map(function(kw) {
            return '<div id="' + keywordCardId(kw) + '" class="ats-keyword-card ats-keyword-missing"><span>' + h(kw) + '</span><button type="button" onclick="Editor.addKeywordWithConfirm(\'' + a(kw) + '\', \'skill\')">' + _ct('coach.ats.verify_add', 'أمتلكها — إضافة') + '</button></div>';
          }).join('') + '</div></div>';
      }

      if (ats.foundKeywords.length > 0) {
        html += '<div style="margin-bottom:16px;">'
          + '<div style="font-size:11px;font-weight:700;color:#16a34a;margin-bottom:8px;">' + _ct('coach.ats.found_jd_kw', 'كلمات متطابقة بنجاح:') + '</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:6px;">'
          + ats.foundKeywords.map(function(kw) {
            return '<span style="background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:4px 8px;border-radius:14px;font-size:11px;font-weight:600;">✓ ' + h(kw) + '</span>';
          }).join('') + '</div></div>';
      }
    } else {
      const readinessColor = ats.score >= 85 ? '#15803d' : ats.score >= 65 ? '#b45309' : '#b91c1c';
      const readinessLabel = ats.score >= 85
        ? _ct('coach.ats.strong', 'قوية')
        : ats.score >= 65
          ? _ct('coach.ats.needs_polish', 'تحتاج مراجعة')
          : _ct('coach.ats.not_ready', 'غير جاهزة');
      const statusIcon = item => item.status === 'ok' ? '✓' : item.status === 'partial' ? '!' : '×';
      const checkRows = items => (items || []).map(function(item) {
        const status = item.status || (item.ok ? 'ok' : 'missing');
        return '<div class="ats-honest-check ' + status + '">'
          + '<span class="ats-honest-check-icon">' + statusIcon(item) + '</span>'
          + '<div><strong>' + h(item.label) + '</strong><small>' + h(item.detail || '') + '</small></div>'
          + '<span class="ats-honest-points">' + Number(item.earned || 0) + '/' + Number(item.points || 0) + '</span>'
          + '</div>';
      }).join('');

      html += '<div class="ats-honest-score">'
        + '<div class="ats-honest-score-head"><div><span>' + _ct('coach.ats.readiness_score','جاهزية السيرة لأنظمة ATS') + '</span><strong style="color:' + readinessColor + ';">' + ats.score + '%</strong></div><b style="color:' + readinessColor + ';">' + readinessLabel + '</b></div>'
        + '<div class="ats-honest-track"><i style="width:' + ats.score + '%;background:' + readinessColor + ';"></i></div>'
        + '<p>' + h(ats.readinessSummary || '') + '</p>'
        + '<div class="ats-score-explanation">' + _ct('coach.ats.composite_explanation','النتيجة تجمع بين قابلية القراءة الآلية وجودة المحتوى، ولا ترتفع لمجرد اختيار قالب ATS.') + '</div>'
        + '</div>';

      html += '<div class="ats-honest-subscore-grid">'
        + '<div><span>' + _ct('coach.ats.parser_score','قابلية القراءة الآلية') + '</span><strong>' + Number(ats.parserScore || 0) + '%</strong><small>' + _ct('coach.ats.parser_hint','القالب، العناوين، واستخراج النص') + '</small></div>'
        + '<div><span>' + _ct('coach.ats.content_score','قوة المحتوى') + '</span><strong>' + Number(ats.contentScore || 0) + '%</strong><small>' + _ct('coach.ats.content_hint','النبذة، الخبرة، التعليم، والمهارات') + '</small></div>'
        + '</div>';

      html += '<section class="ats-honest-section"><div class="ats-honest-section-title"><strong>' + _ct('coach.ats.content_review','مراجعة المحتوى') + '</strong><span>' + _ct('coach.ats.fix_red_first','ابدأ بالعناصر الحمراء والصفراء') + '</span></div>'
        + checkRows(ats.contentChecklist || (ats.readinessChecklist || []).filter(item => item.category === 'content')) + '</section>';
      html += '<details class="ats-parser-details"><summary>' + _ct('coach.ats.show_parser_checks','عرض فحوص القراءة الآلية') + ' <span>' + Number(ats.parserScore || 0) + '%</span></summary><div>'
        + checkRows(ats.parserChecklist || (ats.readinessChecklist || []).filter(item => item.category === 'parser')) + '</div></details>';

      const sugSkills = ats.commonSkills || [];
      if (sugSkills.length > 0) {
        html += '<div class="ats-skill-suggestions"><div class="ats-honest-section-title"><strong>' + _ct('coach.ats.common_skills','مهارات شائعة في مجالك') + '</strong><span>' + _ct('coach.ats.verify_only','أضف فقط ما تستخدمه فعلًا') + '</span></div><div class="ats-skill-suggestion-list">';
        sugSkills.forEach(function(kw) {
          html += '<div id="' + keywordCardId(kw) + '" class="ats-keyword-card">'
            + '<span>' + h(kw) + '</span>'
            + '<button type="button" onclick="Editor.addKeywordWithConfirm(\'' + a(kw) + '\', \'skill\')">+ ' + _ct('coach.ats.add','إضافة') + '</button>'
            + '</div>';
        });
        html += '</div></div>';
      }
    }

    // Target JD Paste Box
    const curJD = career.meta?.targetJD || '';
    html += '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;margin-top:10px;">'
      + '<div style="font-size:11px;font-weight:800;color:#1e40af;margin-bottom:6px;">' + _ct('coach.ats.jd_target_title', 'فحص مطابقة إعلان وظيفة (Job Description)') + '</div>'
      + '<div style="font-size:11px;color:#1e3a8a;line-height:1.4;margin-bottom:8px;">' + _ct('coach.ats.jd_target_desc', 'الصق نص إعلان الوظيفة هنا لحساب نسبة المطابقة الحقيقية ومعرفة الكلمات المفقودة في سيرتك.') + '</div>'
      + '<textarea id="coach-jd-input" rows="3" placeholder="' + _ct('coach.ats.jd_placeholder', 'الصق متطلبات الوظيفة هنا...') + '" style="width:100%;padding:8px;border:1px solid #93c5fd;border-radius:6px;font-size:11px;margin-bottom:8px;resize:vertical;">' + h(curJD) + '</textarea>'
      + '<button style="width:100%;background:#2563eb;color:#fff;border:none;padding:8px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background=\'#1d4ed8\'" onmouseout="this.style.background=\'#2563eb\'" onclick="Editor.applyJDMatch()">' + _ct('coach.ats.analyze_jd', 'تحليل ومطابقة الوظيفة') + '</button>'
      + '</div>';

    html += '</div>';
    panel.innerHTML = html;
  }

  function addKeywordWithConfirm(keyword, type) {
    const card = el(keywordCardId(keyword));
    if (!card) return;
    card.innerHTML = '<div class="ats-keyword-confirm"><strong>' + h(keyword) + '</strong><span>'
      + _ct('coach.ats.do_you_have_exp','هل تمتلك خبرة فعلية بهذه المهارة؟') + '</span><div class="ats-keyword-actions">'
      + '<button class="confirm" onclick="Editor.confirmAddKeyword(\'' + a(keyword) + '\', \'skill\')">' + _ct('coach.ats.yes_add','نعم، أضفها') + '</button>'
      + '<button onclick="Editor.cancelAddKeyword(\'' + a(keyword) + '\')">' + _ct('coach.ats.no','لا') + '</button></div></div>';
  }

  function confirmAddKeyword(keyword, type) {
    const card = el(keywordCardId(keyword));
    pushUndo();
    const category = isAr() ? 'المهارات المؤكدة' : 'Verified Skills';
    career.skills = career.skills || {};
    career.skills[category] = Array.from(new Set((career.skills[category] || []).concat([keyword])));
    saveAndRender();
    if (card) card.innerHTML = '<span class="ats-keyword-added">✓ ' + _ct('coach.ats.added','تمت الإضافة') + '</span>';
  }

  function cancelAddKeyword(keyword) {
    const card = el(keywordCardId(keyword));
    if (card) card.remove();
  }

  async function triggerSmartFix(fixAction, sectionKey, issueId) {
    if (!career) return;
    if (['auto-summary', 'auto-bullets', 'auto-skills'].includes(fixAction)) {
      const targetId = issueId || (fixAction === 'auto-summary' ? 'missing-summary' : fixAction === 'auto-bullets' ? 'thin-bullet' : 'few-skills');
      await applyCoachFix(targetId);
      return;
    }
    // Fallback or edit-* actions: directly open the panel
    openEditPanel(sectionKey || 'personalInfo');
  }

  function applyJDMatch() {
    const input = el('coach-jd-input');
    if (!input) return;
    const jdText = input.value.trim();
    if (jdText.length < 80) {
      showNoticeModal({
        title: isAr() ? 'أضف وصف وظيفة أوضح' : 'Add a clearer job description',
        body: isAr() ? 'الصق وصف الوظيفة الكامل حتى تكون نسبة المطابقة مفيدة وليست رقمًا مضللاً.' : 'Paste the full job description so the match score is useful rather than misleading.'
      });
      return;
    }
    const keywords = extractJDKeywords(jdText);
    const cvText = buildCvSearchText(career); // deliberately excludes meta.targetJD
    const found = keywords.filter(keyword => cvText.includes(keyword));
    const missing = keywords.filter(keyword => !cvText.includes(keyword));
    career.meta = career.meta || {};
    career.meta.targetJD = jdText;
    career.meta.jdMatchScore = keywords.length ? Math.round((found.length / keywords.length) * 100) : 0;
    career.meta.jdFoundKeywords = found.slice(0, 14);
    career.meta.jdMissingKeywords = missing.slice(0, 14);
    career.meta.jdAnalyzedAt = new Date().toISOString();
    saveAndRender();
    switchCoachTab('ats');
  }

  function clearJDMatch() {
    if (career && career.meta) {
      delete career.meta.targetJD;
      delete career.meta.jdMatchScore;
      delete career.meta.jdFoundKeywords;
      delete career.meta.jdMissingKeywords;
    }
    saveAndRender();
    switchCoachTab('ats');
  }

  return {
    init, setTemplate, pickGalleryTemplate, openGallery,
    openEditPanel, closeEditPanel,
    editSection, jumpTo,
    autoFillStarterCV, setAccentColor, setCvFont, togglePhoto, setSectionOrder,
    addExpItem, duplicateExpItem, deleteExpItem,
    addProjItem, duplicateProjItem, deleteProjItem,
    addSkillCat, deleteSkillCat, appendSkillToInput, addEduItem, duplicateEduItem, deleteEduItem,
    addLangItem, duplicateLangItem, deleteLangItem,
    addCertificateItem, duplicateCertificateItem, deleteCertificateItem,
    addAwardItem, duplicateAwardItem, deleteAwardItem,
    showExample,
    aiImprove, aiShorten, aiProfessional, aiTranslate, aiSuggestSkills, handleAIAction, applyCoachFix,
    undoAction, redoAction,
    saveAndRender, renderPreview, handleZoomSelect, toggleGroup,
    showExportModal, closeExportModal,
    exportPdf, exportJson, exportHtml, exportPng, exportDocx,
    switchCoachTab, triggerSmartFix, applyJDMatch, clearJDMatch,
    addKeywordWithConfirm, confirmAddKeyword, cancelAddKeyword,
    showVersionManagerModal, handleCreateVersion, handleSwitchVersion, handleDeleteVersion, showAddSectionModal, createCustomSection, deleteCustomSection,
    showMobMenu, setMobileView, toggleCoachPanel, exportBackup, dismissDataBanner, updateDataSafetyBanner
  };
})();

document.addEventListener('DOMContentLoaded', () => Editor.init());

