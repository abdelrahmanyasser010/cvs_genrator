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
  const LINK_PROOF_FIELDS = ['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'marketing', 'data_analyst'];
  const GITHUB_FIELDS = ['developer', 'data_analyst'];
  const PROJECT_FIELDS = ['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'marketing', 'data_analyst'];

  const el = id => document.getElementById(id);
  const t = (key, fb) => (typeof I18n !== 'undefined' ? I18n.t(key, fb) : fb || key);
  const h = value => (typeof Safety !== 'undefined' ? Safety.escapeHtml(value) : String(value || ''));
  const a = value => (typeof Safety !== 'undefined' ? Safety.escapeAttr(value) : String(value || '').replace(/"/g, '&quot;'));
  const isAr = () => (career?.meta?.locale || I18n?.getLocale?.()) === 'ar';
  const coachName = () => isAr() ? 'عبود Studio' : 'Aboud Studio';

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
  function renderAll() {
    renderSectionsList();
    renderHealthPanel();
    renderCoachPanel();
    renderAISuggestions();
    renderTemplatePicker();
    renderPreview();
    applyStylesheets();
    if(typeof I18n.translateDom === 'function') I18n.translateDom();
  }

  function updateTopbarName() {
    const nameEl = el('topbar-name');
    if (nameEl) nameEl.textContent = career.personalInfo?.name ? `${career.personalInfo.name}'s Resume` : t('ed.myResume', 'My Resume');
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
    career.personalInfo = career.personalInfo || {};
    if (!career.personalInfo.title) career.personalInfo.title = fallbackJobTitle();
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
    if (key === 'projects') return PROJECT_FIELDS.includes(currentField()) || (career.projects || []).length > 0;
    return true;
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
      title: isAr() ? 'صلّي على النبي، حصلت لخبطة بسيطة' : 'Small AI hiccup',
      body: error?.message || (isAr() ? 'جرب تاني بعد لحظة.' : 'Please try again in a moment.'),
      confirmText: isAr() ? 'تمام، هجرب تاني' : 'Try again'
    });
  }

  // ─────────────────────────────────────────────────
  // SECTIONS LIST
  // ─────────────────────────────────────────────────
  const SECTION_DEFS = [
    { key: 'personalInfo', icon: '👤', labelKey: 'ed.sections.personalInfo', defaultLabel: 'Personal Information', group: 'basics' },
    { key: 'summary', icon: '📝', labelKey: 'ed.sections.summary', defaultLabel: 'Professional Summary', group: 'basics' },
    { key: 'experience', icon: '💼', labelKey: 'ed.sections.experience', defaultLabel: 'Work Experience', group: 'basics' },
    { key: 'projects', icon: '🚀', labelKey: 'ed.sections.projects', defaultLabel: 'Projects', group: 'basics' },
    { key: 'skills', icon: '⚡', labelKey: 'ed.sections.skills', defaultLabel: 'Skills', group: 'basics' },
    { key: 'education', icon: '🎓', labelKey: 'ed.sections.education', defaultLabel: 'Education', group: 'extras' },
    { key: 'languages', icon: '🌐', labelKey: 'ed.sections.languages', defaultLabel: 'Languages', group: 'extras' },
    { key: 'certificates', icon: '🏆', labelKey: 'ed.sections.certificates', defaultLabel: 'Certifications', group: 'extras' },
    { key: 'awards', icon: '⭐', labelKey: 'ed.sections.awards', defaultLabel: 'Awards', group: 'extras' },
    { key: 'references', icon: '🤝', labelKey: 'ed.sections.references', defaultLabel: 'References', group: 'extras' },
  ];

  function getSectionStatus(key) {
    const issue = getSectionIssue(key);
    if (issue?.severity === 'blocker') return 'missing';
    if (issue?.severity === 'warn') return 'warn';
    switch (key) {
      case 'personalInfo': return career.personalInfo?.name && career.personalInfo?.email ? 'done' : 'warn';
      case 'summary': return career.professionalSummary?.trim() ? 'done' : 'missing';
      case 'experience': return (career.experience || []).length > 0 ? 'done' : 'missing';
      case 'projects': return (career.projects || []).length > 0 ? 'done' : 'warn';
      case 'skills': return Object.keys(career.skills || {}).length > 0 ? 'done' : 'warn';
      case 'education': return (career.education || []).length > 0 ? 'done' : 'warn';
      default: return 'empty';
    }
  }

  function getSectionIssue(key) {
    if (typeof AICoach === 'undefined') return null;
    const review = AICoach.getPreExportReview(career);
    const priority = { blocker: 3, warn: 2, tip: 1, good: 0 };
    return review.items
      .filter(item => item.section === key)
      .sort((left, right) => (priority[right.severity] || 0) - (priority[left.severity] || 0))[0] || null;
  }

  function getSectionPreview(key) {
    const maxLen = 60;
    const trunc = s => s && s.length > maxLen ? s.slice(0, maxLen) + '…' : (s || '');
    switch (key) {
      case 'personalInfo': return career.personalInfo?.email || '';
      case 'summary': return trunc(career.professionalSummary);
      case 'experience': return (career.experience || []).length > 0 ? `${career.experience[0]?.role || ''} at ${career.experience[0]?.company || ''}` : '';
      case 'projects': return (career.projects || []).length > 0 ? career.projects[0]?.name || '' : '';
      case 'skills': return Object.values(career.skills || {}).flat().slice(0, 4).join(', ');
      case 'education': return (career.education || []).length > 0 ? (career.education[0]?.degree || '') : '';
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

    const groups = [
      { id: 'basics', labelKey: 'ed.groups.basics', defaultLabel: 'Resume Sections' },
      { id: 'extras', labelKey: 'ed.groups.extras', defaultLabel: 'Additional' },
    ];

    list.innerHTML = groups.map(group => {
      const isCollapsed = career.meta.collapsedGroups.includes(group.id);
      const sections = SECTION_DEFS.filter(s => s.group === group.id && shouldShowSection(s.key));
      return `
        <div class="section-group">
          <div class="section-group-label" onclick="Editor.toggleGroup('${group.id}')" style="cursor:pointer; display:flex; justify-content:space-between;">
            <span>${t(group.labelKey, group.defaultLabel)}</span>
            <span>${isCollapsed ? '▼' : '▲'}</span>
          </div>
          <div style="display: ${isCollapsed ? 'none' : 'block'}">
            ${sections.map(s => renderSectionRow(s)).join('')}
          </div>
        </div>
      `;
    }).join('');

    // Bind clicks
    list.querySelectorAll('.section-row').forEach(row => {
      row.addEventListener('click', () => openEditPanel(row.dataset.key));
    });
  }

  function renderSectionRow(s) {
    const status = getSectionStatus(s.key);
    const issue = getSectionIssue(s.key);
    const preview = getSectionPreview(s.key);
    const statusIcon = status === 'done' ? '<span class="status-dot done"></span>' :
      status === 'warn' ? '<span class="status-dot warn"></span>' :
        '<span class="status-dot missing"></span>';

    return `
      <div class="section-row ${issue ? `needs-attention ${issue.severity}` : ''}" data-key="${s.key}">
        <div class="section-row-icon">${s.icon}</div>
        <div class="section-row-info">
          <div class="section-row-label">${h(t(s.labelKey, s.defaultLabel))}</div>
          ${issue ? `<div class="section-row-preview issue">${h(issue.title)}</div>` : preview ? `<div class="section-row-preview">${h(preview)}</div>` : ''}
        </div>
        <div class="section-row-status">${statusIcon}</div>
      </div>
    `;
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
  function openEditPanel(sectionKey) {
    currentEditSection = sectionKey;
    const def = SECTION_DEFS.find(s => s.key === sectionKey);
    if (!def) return;

    el('edit-panel-title').textContent = `${def.icon} ${t(def.labelKey, def.defaultLabel)}`;
    el('edit-panel-body').innerHTML = buildSectionCoach(sectionKey) + buildEditForm(sectionKey);
    el('edit-ai-pills').innerHTML = buildAIPills(sectionKey);

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
      });
      input.addEventListener('blur', () => {
        collectFormData(sectionKey);
        saveAndRender();
      });
    });

    initSortable(sectionKey);
    el('edit-overlay').style.display = 'flex';
  }

  function initSortable(sectionKey) {
    if (typeof Sortable === 'undefined') return;
    const listIds = { experience: 'exp-list', projects: 'proj-list', education: 'edu-list', skills: 'skill-list', languages: 'lang-list' };
    const propMap = { experience: 'experience', projects: 'projects', education: 'education', skills: 'skills', languages: 'languages' };
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
    currentEditSection = null;
  }

  function buildAIPills(sectionKey) {
    const pills = [
      { label: t('ed.ai_pills.improve', '✨ Improve'), action: `aiImprove('${sectionKey}')` },
      { label: t('ed.ai_pills.shorten', '✂️ Shorten'), action: `aiShorten('${sectionKey}')` },
      { label: t('ed.ai_pills.professional', '🎯 Professional'), action: `aiProfessional('${sectionKey}')` },
      { label: t('ed.ai_pills.translate', '🌐 Translate'), action: `aiTranslate('${sectionKey}')` },
    ];
    if (sectionKey === 'skills') pills.push({ label: t('ed.ai_pills.suggest_skills', '💡 Suggest Skills'), action: `aiSuggestSkills()` });
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
      default: return `<p class="edit-empty">${t('ed.empty_edit', 'Click a field to edit this section.')}</p>`;
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
    }
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
    return `
      <div class="form-grid">
        <div class="form-field">
          <label class="form-label">${t('ed.form.fullName', 'Full Name')}</label>
          <input class="form-input" id="f-name" type="text" placeholder="${t('ed.form.ph_name', 'e.g. Ahmed Ali')}" value="${a(pi.name || '')}">
        </div>
        <div class="form-field">
          <label class="form-label">${t('ed.form.jobTitle', 'Job Title')}</label>
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
      </div>
    `;
  }
  function collectPersonalInfo() {
    if (!career.personalInfo) career.personalInfo = {};
    if (!career.personalInfo.links) career.personalInfo.links = {};
    career.personalInfo.name = el('f-name')?.value ?? career.personalInfo.name;
    career.personalInfo.title = el('f-title')?.value ?? career.personalInfo.title;
    career.personalInfo.email = el('f-email')?.value ?? career.personalInfo.email;
    career.personalInfo.phone = el('f-phone')?.value ?? career.personalInfo.phone;
    career.personalInfo.location = el('f-location')?.value ?? career.personalInfo.location;
    career.personalInfo.links.linkedin = el('f-linkedin')?.value ?? career.personalInfo.links.linkedin;
    if (el('f-github')) career.personalInfo.links.github = el('f-github').value;
    updateTopbarName();
  }

  // ─── SUMMARY ───
  function buildSummaryForm() {
    return `
      <div class="form-field form-field-full">
        <label class="form-label">${t('ed.form.summary', 'Professional Summary')}</label>
        <p class="form-hint">${t('ed.form.summary_hint', 'Write 2–3 sentences about your experience and goals. Be specific.')}</p>
        <textarea class="form-textarea" id="f-summary" rows="6" placeholder="${getPh().summary || t('ed.form.ph_summary', 'e.g. Software Engineer with 5+ years...') }">${h(career.professionalSummary || '')}</textarea>
      </div>
      <button class="btn-generate" onclick="Editor.handleAIAction('generate-summary')">${t('ed.form.generate_ai', '✨ Generate with AI')}</button>
    `;
  }
  function collectSummary() {
    career.professionalSummary = el('f-summary')?.value ?? career.professionalSummary;
  }

  // ─── EXPERIENCE ───
  function buildExperienceForm() {
    const exps = career.experience || [];
    const items = exps.map((e, i) => `
      <div class="list-item" data-idx="${i}">
        <div class="list-item-header">
          <span class="list-item-title">${h(e.role || t('ed.form.newRole', 'New Role'))} at ${h(e.company || '...')}</span>
          <div>
            <button class="list-item-btn" onclick="Editor.duplicateExpItem(${i})" title="Duplicate">📋</button>
            <button class="list-item-del" onclick="Editor.deleteExpItem(${i})" title="Delete">✕</button>
          </div>
        </div>
        <div class="form-grid">
          <div class="form-field">
            <label class="form-label">${t('ed.form.company', 'Company')}</label>
            <input class="form-input" id="f-exp-co-${i}" type="text" placeholder="${t('ed.form.ph_company', 'Company name')}" value="${a(e.company || '')}">
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
            <textarea class="form-textarea" id="f-exp-desc-${i}" rows="4" placeholder="${t('ed.form.ph_desc', 'Describe what you accomplished...')}">${h(e.rawDescription || (e.bullets || []).join('\n'))}</textarea>
            <div style="font-size:11.5px;color:#64748b;margin-top:4px;">💡 <b>نصيحة:</b> مش عارف تكتب إيه في المهام؟ اضغط على زر <b>"⚡ إدراج مهام جاهزة لمجالي"</b> بالأعلى وسنقوم بكتابتها فوراً!</div>
          </div>
        </div>
      </div>
    `).join('');

    return `
      <div class="section-actions-top">
        <button class="btn-text-action" onclick="Editor.showExample('experience')" style="font-weight:600;color:var(--primary,#2563eb);">⚡ ${t('ed.actions.auto_tasks', 'إدراج مهام جاهزة لمجالي')}</button>
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
            <button class="list-item-btn" onclick="Editor.duplicateProjItem(${i})" title="Duplicate">📋</button>
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
        <button class="btn-text-action" onclick="Editor.showExample('projects')">💡 Show Example</button>
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
            <label class="form-label">${t('ed.form.skills_comma', 'Skills (comma separated)')}</label>
            <input class="form-input" id="f-skill-vals-${i}" type="text" placeholder="${getPh().skills || t('ed.form.ph_skill_vals', 'React, TypeScript, CSS')}" value="${a((skills || []).join(', '))}">
            <div style="font-size:11.5px;color:#64748b;margin-top:4px;">💡 <b>نصيحة:</b> افصل بين كل مهارة وأخرى بفاصلة (،) أو اضغط على أي مهارة من المقترحات الجاهزة بالأسفل لإضافتها فوراً!</div>
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

  // ─── EDUCATION ───
  function buildEducationForm() {
    const edus = career.education || [];
    const items = edus.map((e, i) => `
      <div class="list-item">
        <div class="list-item-header">
          <span class="list-item-title">${h(e.degree || t('ed.form.degree_fallback', 'Degree'))}</span>
          <div>
            <button class="list-item-btn" onclick="Editor.duplicateEduItem(${i})" title="Duplicate">📋</button>
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
            <button class="list-item-btn" onclick="Editor.duplicateLangItem(${i})" title="Duplicate">📋</button>
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
  // AI COACH
  function severityLabel(severity) {
    if (severity === 'blocker') return t('ed.coach.blocker', 'Must fix');
    if (severity === 'warn') return t('ed.coach.warn', 'Improve');
    if (severity === 'good') return t('ed.coach.good', 'Good');
    return t('ed.coach.tip', 'Tip');
  }

  function buildSectionCoach(sectionKey) {
    if (typeof AICoach === 'undefined') return '';
    const advice = AICoach.getSectionAdvice(career, sectionKey).slice(0, 2);
    return `
      <div class="section-coach">
        <div class="section-coach-kicker">${h(coachName())}</div>
        ${advice.map(item => `
          <div class="section-coach-item ${item.severity}">
            <div class="section-coach-title">${h(item.title)}</div>
            <div class="section-coach-detail">${h(item.detail)}</div>
          </div>
        `).join('')}
      </div>`;
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

  async function applyCoachFix(issueId) {
    if (typeof AICoach === 'undefined') return;
    pushUndo();
    const before = JSON.stringify(career);
    const result = await AICoach.applyQuickFix(career, issueId);
    if (JSON.stringify(career) !== before) {
      saveAndRender();
      showSaveIndicator(result.message || t('ed.saved', 'Saved'), true);
      if (currentEditSection) openEditPanel(currentEditSection);
      renderExportReview();
      return;
    }
    undoStack.pop();
    const review = AICoach.getPreExportReview(career);
    const item = review.items.find(x => x.id === issueId);
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
          <div class="suggestions-empty-icon">✨</div>
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
  function renderTemplatePicker() {
    const root = el('template-picker');
    if (!root) return;
    const effective = TemplateSelector.getEffectiveTemplateId(career);
    root.innerHTML = TemplateSelector.getFeaturedTemplates().map(tpl => {
      const active = career.meta.templateId === tpl.id;
      const label = tpl.id === 'ai-recommended'
        ? `⭐ ${TemplateSelector.templateName(effective, t)}`
        : t(tpl.nameKey, tpl.id);
      return `<button class="template-chip ${active ? 'active' : ''}" onclick="Editor.setTemplate('${tpl.id}')">${h(label)}</button>`;
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

  // ─────────────────────────────────────────────────
  // GALLERY
  // ─────────────────────────────────────────────────
  function openGallery() {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'flex';
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
    overlay.innerHTML = `
      <div class="modal-box" style="max-width:640px">
        <div class="modal-header">
          <h3>${t('ed.gallery.title', 'Template Gallery')}</h3>
          <button class="modal-close" onclick="this.closest('.modal-overlay').remove()">✕</button>
        </div>
        <div class="gallery-chips">
          ${TemplateSelector.getTemplates().map(tpl => `
            <button class="gallery-chip ${career.meta.templateId === tpl.id ? 'active' : ''}" onclick="Editor.pickGalleryTemplate('${tpl.id}'); this.closest('.modal-overlay').remove()">
              ${h(TemplateSelector.templateName(tpl.id, t))}
            </button>`).join('')}
        </div>
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
    CareerStorage.save(career);
    renderAll();
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => showSaveIndicator(t('ed.saved', 'Saved ✓'), true), 400);
  }

  function showSaveIndicator(msg, fade = false) {
    const ind = el('save-indicator');
    if (!ind) return;
    ind.textContent = msg;
    ind.className = 'save-indicator ' + (fade ? 'saved' : 'saving');
    if (fade) setTimeout(() => { ind.textContent = ''; ind.className = 'save-indicator'; }, 2500);
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
        if (improved && await showDecisionModal({
          title: isAr() ? 'الله عليك، الصياغة اتظبطت' : 'This reads cleaner now',
          body: improved,
          confirmText: isAr() ? 'طبق الكلام ده' : 'Apply this',
          cancelText: isAr() ? 'سيب القديم' : 'Keep current'
        })) {
          pushUndo(); career.professionalSummary = improved; saveAndRender(); openEditPanel('summary');
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
        pushUndo();
        let applied = false;
        if (typeof AIClient !== 'undefined' && AIClient.configured()) {
          const improved = await AIClient.improveBullets(career);
          if (Array.isArray(improved)) {
            improved.forEach((item, index) => {
              if (career.experience?.[index] && Array.isArray(item.bullets)) {
                career.experience[index].bullets = item.bullets;
                career.experience[index].rawDescription = item.bullets.join('\n');
                applied = true;
              }
            });
          }
        }
        if (!applied && typeof AICoach !== 'undefined') {
          AICoach.improveExperienceBullets(career);
          applied = true;
        }
        if (applied) { saveAndRender(); openEditPanel('experience'); }
        else undoStack.pop();
      } catch (e) {
        undoStack.pop();
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
        if (await showDecisionModal({
          title: isAr() ? 'دغدغ الدنيا، اختصار أخف وأوضح' : 'Shorter, cleaner version',
          body: shortened,
          confirmText: isAr() ? 'استخدم المختصر' : 'Use shorter text',
          cancelText: isAr() ? 'رجعني' : 'Cancel'
        })) {
          pushUndo(); career.professionalSummary = shortened; saveAndRender(); openEditPanel('summary');
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
      suggested = suggested.slice(0, 6);
      if (suggested.length && await showDecisionModal({
        title: isAr() ? 'دي مهارات ترفع الشغل' : 'Relevant skills for this role',
        body: suggested.join(', '),
        confirmText: isAr() ? 'ضيفهم للسيرة' : 'Add skills',
        cancelText: isAr() ? 'مش دلوقتي' : 'Not now'
      })) {
        pushUndo();
        const existing = Object.values(career.skills || {}).flat();
        const category = career.meta?.locale === 'ar' ? 'المهارات الأساسية' : 'Core Skills';
        career.skills = { [category]: [...new Set([...existing, ...suggested])] };
        saveAndRender();
        // Force immediate update if panel is open
        if(currentEditSection === 'skills') {
          openEditPanel('skills');
        }
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
          if (text && await showDecisionModal({
            title: isAr() ? 'نبذة زي الناس جاهزة' : 'A strong summary is ready',
            body: text,
            confirmText: isAr() ? 'حطها في السيرة' : 'Use this summary',
            cancelText: isAr() ? 'لأ، سيب القديم' : 'Keep current'
          })) { pushUndo(); career.professionalSummary = text; saveAndRender(); openEditPanel('summary'); }
        })().catch(e => showAIError(e)).finally(() => setAILoading(false));
        break;
      case 'improve-summary': aiImprove('summary'); break;
      case 'shorten-summary': aiShorten('summary'); break;
      case 'translate-summary': aiTranslate('summary'); break;
      case 'suggest-skills': aiSuggestSkills(); break;
      case 'tailor-job': tailorJob(); break;
      case 'edit-skills': openEditPanel('skills'); break;
      case 'edit-experience': openEditPanel('experience'); break;
      case 'edit-education': openEditPanel('education'); break;
      case 'improve-bullets':
        setAILoading(true);
        (async () => {
          pushUndo();
          let applied = false;
          if (typeof AIClient !== 'undefined' && AIClient.configured()) {
            const improved = await AIClient.improveBullets(career);
            if (Array.isArray(improved)) {
              improved.forEach((item, index) => {
                if (career.experience?.[index] && Array.isArray(item.bullets)) {
                  career.experience[index].bullets = item.bullets;
                  career.experience[index].rawDescription = item.bullets.join('\n');
                  applied = true;
                }
              });
            }
          }
          if (!applied && typeof AICoach !== 'undefined') AICoach.improveExperienceBullets(career);
          saveAndRender();
        })().catch(e => showAIError(e)).finally(() => setAILoading(false));
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
  async function exportPdf() {
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
    window.print();
  }
  function exportJson() { CareerStorage.download(career); }
  function exportHtml() {
    const cvHtml = CVRenderer.renderBody(career);
    const name = career.personalInfo?.name || 'cv';
    const themePath = TemplateSelector.getThemeCssPath(TemplateSelector.getEffectiveThemeId(career)).replace(/^\//, '');
    const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${h(name)}</title>
      <link rel="stylesheet" href="templates/shared/base.css">
      <link rel="stylesheet" href="templates/layouts/layouts.css">
      <link rel="stylesheet" href="${themePath}">
      </head><body>${cvHtml}</body></html>`;
    const blob = new Blob([full], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name.replace(/\s+/g, '_') + '.html';
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
      const name = career.personalInfo?.name || 'cv';
      a.href = url;
      a.download = name.replace(/\s+/g, '_') + '.png';
      a.click();
    } catch (err) {
      console.error('PNG export failed:', err);
      alert(isAr() ? 'حدث خطأ أثناء تصدير الصورة' : 'Error exporting PNG');
    }
  }

  function exportDocx() {
    const cvHtml = CVRenderer.renderBody(career);
    const name = career.personalInfo?.name || 'cv';
    if (typeof htmlDocx === 'undefined') {
      const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${h(name)}</title></head><body>${cvHtml}</body></html>`;
      const blob = new Blob(['\ufeff', full], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name.replace(/\s+/g, '_') + '.doc';
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    try {
      const full = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>${h(name)}</title></head><body>${cvHtml}</body></html>`;
      const converted = htmlDocx.asBlob(full);
      const url = URL.createObjectURL(converted);
      const a = document.createElement('a');
      a.href = url;
      a.download = name.replace(/\s+/g, '_') + '.docx';
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('DOCX export failed:', err);
      alert(isAr() ? 'حدث خطأ أثناء تصدير ملف الوورد' : 'Error exporting DOCX');
    }
  }

  async function tailorJob() {
    const ar = isAr();
    const jdText = await showInputModal({
      title: ar ? '🎯 تخصيص السيرة الذاتية لوظيفة (Tailor to Job)' : '🎯 Tailor Resume to Job Description',
      body: ar ? 'انسخ وألصق وصف الوظيفة (Job Description) هنا، وسيقوم النظام بتحليل الكلمات المفتاحية المطلوبة ومقارنتها بمهاراتك:' : 'Paste the target Job Description (JD) below. We will analyze missing ATS keywords and suggest skills to add:',
      placeholder: ar ? 'ألصق متطلبات الوظيفة هنا...' : 'Paste job requirements here...'
    });
    if (!jdText || !jdText.trim()) return;

    setAILoading(true);
    try {
      const field = currentField();
      let missingSkills = [];
      if (typeof ContentPicker !== 'undefined' && ContentPicker.getKnowledge) {
        const kb = await ContentPicker.getKnowledge(career, field);
        if (kb && kb.keywords) {
          const jdLower = jdText.toLowerCase();
          const currentSkillsLower = Object.values(career.skills || {}).flat().map(s => String(s).toLowerCase());
          missingSkills = kb.keywords.filter(kw => {
            const kwStr = typeof kw === 'string' ? kw : (ar ? kw.ar : kw.en);
            return kwStr && jdLower.includes(kwStr.toLowerCase()) && !currentSkillsLower.some(cs => cs.includes(kwStr.toLowerCase()));
          }).map(kw => typeof kw === 'string' ? kw : (ar ? kw.ar : kw.en));
        }
      }
      if (missingSkills.length === 0) {
        if (typeof ContentPicker !== 'undefined' && ContentPicker.getKnowledge) {
          const kb = await ContentPicker.getKnowledge(career, field);
          if (kb && kb.keywords) {
            missingSkills = kb.keywords.slice(0, 5).map(kw => typeof kw === 'string' ? kw : (ar ? kw.ar : kw.en));
          }
        }
      }

      if (missingSkills.length > 0) {
        if (await showDecisionModal({
          title: ar ? '🚀 كلمات مفتاحية مفقودة من وصف الوظيفة!' : '🚀 ATS Keywords Found in JD',
          body: (ar ? 'وجدنا الكلمات المفتاحية التالية مطلوبة في الوظيفة وغير موجودة في سيرتك الذاتية:\n\n• ' : 'We identified these requested ATS keywords missing from your skills:\n\n• ') + missingSkills.join('\n• ') + (ar ? '\n\nهل تريد إضافتها فوراً لمهاراتك؟' : '\n\nAdd them to your skills immediately?'),
          confirmText: ar ? 'أضف المهارات فوراً' : 'Add to Skills',
          cancelText: ar ? 'إلغاء' : 'Cancel'
        })) {
          pushUndo();
          career.skills = career.skills || {};
          career.skills['Target JD Skills'] = [...(career.skills['Target JD Skills'] || []), ...missingSkills];
          saveAndRender();
          openEditPanel('skills');
        }
      } else {
        showNoticeModal({
          title: ar ? 'تطابق ممتاز!' : 'Great Match!',
          body: ar ? 'سيرتك الذاتية تحتوي بالفعل على أهم الكلمات المفتاحية المطلوبة في وصف هذه الوظيفة.' : 'Your resume already includes the core keywords found in this Job Description!',
          confirmText: ar ? 'رائع' : 'Awesome'
        });
      }
    } catch (e) {
      console.error('Tailor error:', e);
    } finally {
      setAILoading(false);
    }
  }

  // ─────────────────────────────────────────────────
  // LEGACY SECTION EDIT SUPPORT (for outside callers)
  // ─────────────────────────────────────────────────
  function editSection(section) { openEditPanel(section); }
  function jumpTo(action) {
    if (action.startsWith('edit-')) openEditPanel(action.replace('edit-', ''));
  }

  return {
    init, setTemplate, pickGalleryTemplate, openGallery,
    openEditPanel, closeEditPanel,
    editSection, jumpTo,
    addExpItem, duplicateExpItem, deleteExpItem,
    addProjItem, duplicateProjItem, deleteProjItem,
    addSkillCat, deleteSkillCat, addEduItem, duplicateEduItem, deleteEduItem,
    addLangItem, duplicateLangItem, deleteLangItem,
    showExample,
    aiImprove, aiShorten, aiProfessional, aiTranslate, aiSuggestSkills, handleAIAction, applyCoachFix,
    undoAction, redoAction,
    saveAndRender, renderPreview, handleZoomSelect, toggleGroup,
    showExportModal, closeExportModal,
    exportPdf, exportJson, exportHtml, exportPng, exportDocx,
  };
})();

document.addEventListener('DOMContentLoaded', () => Editor.init());

