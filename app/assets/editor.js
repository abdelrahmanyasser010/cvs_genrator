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

    // Mobile & Tablet init & resize handler
    const handleResize = () => {
      const isMobile = window.matchMedia('(max-width: 1024px)').matches;
      if (!isMobile) {
        document.body.classList.remove('mobile-edit-mode', 'mobile-preview-mode', 'mobile-coach-mode');
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
      badge.textContent = activeId === 'default' ? 'النسخة الرئيسية' : (career.meta?.versionName ? (career.meta.versionName.slice(0, 15) + '...') : 'نسخة مخصصة');
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
    { key: 'awards', icon: '⭐', labelKey: 'ed.sections.awards', defaultLabel: 'Awards', group: 'extras' }
  ];

  function getSectionStatus(key) {
    const issue = getSectionIssue(key);
    if (issue?.severity === 'high') return 'missing';
    if (issue?.severity === 'medium') return 'warn';
    if (issue?.severity === 'low') return 'tip';
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
    const priority = { high: 3, medium: 2, low: 1 };
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

    const isAr = career.meta?.locale === 'ar' || document.documentElement.lang === 'ar';
    const bannerHtml = `
      <div style="margin-bottom:14px;padding:12px;background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;">
        <div style="font-size:11px;font-weight:800;color:#1d4ed8;margin-bottom:4px;">💡 ${isAr ? 'مش عارف تكتب إيه خالص؟' : 'Not sure what to write?'}</div>
        <div style="font-size:12px;color:#1e293b;margin-bottom:8px;">${isAr ? 'املأ سيرة ذاتية نموذجية متكاملة لمجالك ومستواك بضغطة واحدة، وعدّل عليها بسهولة!' : 'Generate a complete model resume for your field in 1 click!'}</div>
        <button type="button" style="width:100%;padding:8px 12px;background:#2563eb;color:#fff;border:none;border-radius:6px;font-weight:700;font-size:12px;cursor:pointer;" onclick="Editor.autoFillStarterCV()">
          🪄 ${isAr ? 'ملء نموذج سيرة ذاتية كامل (1-Click Auto-Fill)' : 'Auto-Fill Complete Sample Resume'}
        </button>
      </div>

      <div style="margin-bottom:14px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
        <div style="font-size:11px;font-weight:700;color:#334155;margin-bottom:6px;">🎨 ${isAr ? 'لون السيرة الذاتية (Accent Color)' : 'Accent Color'}</div>
        <div style="display:flex;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
          ${[
            { color: '#2563eb', label: 'أزرق ملكي' },
            { color: '#059669', label: 'أخضر زمردي' },
            { color: '#7c3aed', label: 'بنفسجي فاخر' },
            { color: '#be123c', label: 'عنابي أنيق' },
            { color: '#1e293b', label: 'كحلي داكن' }
          ].map(c => `
            <button type="button" title="${c.label}" style="width:30px;height:30px;border-radius:50%;background:${c.color};border:2.5px solid ${career.meta.accentColor === c.color ? '#0f172a' : '#fff'};box-shadow:0 1px 4px rgba(0,0,0,0.25);cursor:pointer;" onclick="Editor.setAccentColor('${c.color}')"></button>
          `).join('')}
        </div>

        <div style="font-size:11px;font-weight:700;color:#334155;margin-bottom:6px;">🔤 ${isAr ? 'الخط العربي (Font Style)' : 'Font Style'}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
          ${['Inter', 'Cairo', 'Tajawal', 'Almarai'].map(f => `
            <button type="button" style="padding:6px 10px;font-size:11.5px;border-radius:6px;border:1px solid #cbd5e1;background:${career.meta.fontFamily === f ? '#e2e8f0' : '#fff'};font-family:'${f}',sans-serif;cursor:pointer;font-weight:600;" onclick="Editor.setCvFont('${f}')">${f}</button>
          `).join('')}
        </div>

        <div style="font-size:11px;font-weight:700;color:#334155;margin-bottom:6px;">📷 ${isAr ? 'الصورة الشخصية (Profile Photo)' : 'Profile Photo'}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;">
          <button type="button" style="flex:1 1 130px;padding:8px;font-size:11.5px;border-radius:6px;border:1px solid #cbd5e1;background:${career.meta.showPhoto ? '#dcfce7' : '#fff'};color:#15803d;font-weight:600;cursor:pointer;" onclick="Editor.togglePhoto(true)">
            ✅ ${isAr ? 'إظهار الصورة' : 'Show Photo'}
          </button>
          <button type="button" style="flex:1 1 130px;padding:8px;font-size:11.5px;border-radius:6px;border:1px solid #cbd5e1;background:${!career.meta.showPhoto ? '#fee2e2' : '#fff'};color:#b91c1c;font-weight:600;cursor:pointer;" onclick="Editor.togglePhoto(false)">
            🚫 ${isAr ? 'إخفاء (لـ ATS)' : 'Hide (ATS)'}
          </button>
        </div>

        <div style="font-size:11px;font-weight:700;color:#334155;margin-bottom:6px;">↕️ ${isAr ? 'ترتيب الأقسام (التعليم أولاً أم الخبرة؟)' : 'Section Order'}</div>
        <div style="display:flex;flex-wrap:wrap;gap:6px;">
          <button type="button" style="flex:1 1 130px;padding:8px;font-size:11.5px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-weight:600;cursor:pointer;" onclick="Editor.setSectionOrder(['summary', 'education', 'experience', 'projects', 'skills', 'languages'])">
            🎓 ${isAr ? 'التعليم أولاً' : 'Education First'}
          </button>
          <button type="button" style="flex:1;padding:6px;font-size:11px;border-radius:6px;border:1px solid #cbd5e1;background:#fff;color:#334155;font-weight:600;cursor:pointer;" onclick="Editor.setSectionOrder(['summary', 'experience', 'education', 'projects', 'skills', 'languages'])">
            💼 ${isAr ? 'الخبرة أولاً' : 'Experience First'}
          </button>
        </div>
      </div>
    `;

    const groups = [
      { id: 'basics', labelKey: 'ed.groups.basics', defaultLabel: 'Resume Sections' },
      { id: 'extras', labelKey: 'ed.groups.extras', defaultLabel: 'Additional' },
    ];

    const gs = document.getElementById('global-settings');
    if (gs) gs.innerHTML = bannerHtml;

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
    const isAr = career.meta?.locale === 'ar' || document.documentElement.lang === 'ar';
    let statusHtml = status === 'done' ? `<span class="section-status status-done">✓ ${isAr ? 'مكتمل' : 'Done'}</span>` : '';
    if (issue) {
      if (issue.severity === 'high') statusHtml = `<span class="section-status status-missing">↑ ${isAr ? 'أثر عالي' : 'High Impact'}</span>`;
      else if (issue.severity === 'medium') statusHtml = `<span class="section-status status-warn">↗ ${isAr ? 'أثر متوسط' : 'Med Impact'}</span>`;
      else statusHtml = `<span class="section-status status-warn">→ ${isAr ? 'تحسين' : 'Low Impact'}</span>`;
    } else if (status !== 'done') {
      statusHtml = `<span class="section-status status-missing">+ ${isAr ? 'مفقود' : 'Add'}</span>`;
    }

    return `
      <div class="section-row ${issue ? `needs-attention ${issue.severity}` : ''}" data-key="${s.key}">
        <div class="section-row-icon">${s.icon}</div>
        <div class="section-row-info">
          <div class="section-row-label">${h(t(s.labelKey, s.defaultLabel))}</div>
          ${issue ? `<div class="section-row-preview issue">${h(issue.title)}</div>` : preview ? `<div class="section-row-preview">${h(preview)}</div>` : ''}
        </div>
        <div class="section-row-status">${statusHtml}</div>
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
    const def = SECTION_DEFS.find(s => s.key === sectionKey);
    if (!def) return;

    el('edit-panel-title').textContent = `${def.icon} ${t(def.labelKey, def.defaultLabel)}`;
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
      saveBtn.textContent = 'إغلاق';
      saveBtn.style.background = '#64748b'; // slate-500
    }
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
    document.body.classList.remove('edit-panel-open');
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
    const isAr = career.meta?.locale === 'ar' || document.documentElement.lang === 'ar';
    return `
      <div class="form-field form-field-full">
        <label class="form-label">${t('ed.form.summary', 'Professional Summary')}</label>
        <p class="form-hint">${t('ed.form.summary_hint', 'Write 2–3 sentences about your experience and goals. Be specific.')}</p>
        <textarea class="form-textarea" id="f-summary" rows="6" placeholder="${getPh().summary || t('ed.form.ph_summary', 'e.g. Software Engineer with 5+ years...') }">${h(career.professionalSummary || '')}</textarea>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px;margin-top:12px;">
        <button type="button" class="btn-generate" style="font-weight:700;padding:12px 18px;background:var(--primary,#2563eb);color:#fff;border-radius:8px;border:none;cursor:pointer;width:100%;text-align:center;" onclick="Editor.handleAIAction('generate-summary')">
          ✨ ${isAr ? 'توليد نبذة احترافية بضغطة واحدة (AI / مقترحات لمجالي)' : 'Generate Professional Summary (AI / Smart Match)'}
        </button>
      </div>
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
              <div style="font-size:11.5px;color:#64748b;margin-top:6px;">💡 <b>نصيحة:</b> افصل بين كل مهارة وأخرى بفاصلة (،) أو اضغط على المقترحات الجاهزة لإضافتها فوراً:</div>
              <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:8px;">
                ${['Excel', 'Word', 'إعداد التقارير المالية', 'التحليل المالي', 'المراجعة والتدقيق', 'أنظمة ERP', 'التواصل الفعال', 'حل المشكلات'].map(sk => `
                  <button type="button" style="background:#eff6ff;border:1px solid #bfdbfe;color:#1e40af;padding:4px 10px;border-radius:14px;font-size:12px;cursor:pointer;font-weight:500;" onclick="Editor.appendSkillToInput(${i}, '${sk}')">+ ${sk}</button>
                `).join('')}
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
    const oldModal = document.getElementById('smartfix-preview-modal');
    if (oldModal) oldModal.remove();

    const isAr = (career.meta?.locale || 'ar') === 'ar';
    const modal = document.createElement('div');
    modal.id = 'smartfix-preview-modal';
    modal.style.cssText = 'display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.75);z-index:999999;backdrop-filter:blur(4px);padding:20px;';
    modal.innerHTML = `
      <div class="modal-card" style="background:#fff;border-radius:16px;max-width:760px;width:100%;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;direction:${isAr ? 'rtl' : 'ltr'};">
        <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;background:#f8fafc;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px;">✨</span>
            <div>
              <h3 style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${h(title || (isAr ? 'معاينة التحسين المقترح بالمقارنة' : 'SmartFix Before & After Preview'))}</h3>
              <div style="font-size:12px;color:#64748b;">${isAr ? 'راجع التعديل المطور بالذكاء الاصطناعي وقارنه بالنص الحالي قبل اعتماده' : 'Review the AI enhanced content against your current content before applying'}</div>
            </div>
          </div>
          <button onclick="document.getElementById('smartfix-preview-modal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;">✕</button>
        </div>
        <div style="padding:24px;overflow-y:auto;flex:1;display:grid;grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));gap:20px;">
          <div style="border:1px solid #f1f5f9;border-radius:12px;padding:16px;background:#f8fafc;display:flex;flex-direction:column;">
            <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#94a3b8;"></span> ${isAr ? 'الوضع الحالي (Before)' : 'Current Content (Before)'}
            </div>
            <div style="font-size:13px;line-height:1.7;color:#334155;white-space:pre-wrap;font-family:inherit;">${h(beforeText || (isAr ? '(قسم فارغ أو غير ممتلئ)' : '(Empty section)'))}</div>
          </div>
          <div style="border:2px solid #10b981;border-radius:12px;padding:16px;background:#f0fdf4;display:flex;flex-direction:column;position:relative;">
            <div style="font-size:12px;font-weight:700;color:#047857;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
              <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;"></span> ${isAr ? 'الاقتراح المطور (AI Enhanced)' : 'AI Proposed Content'}</span>
              <span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:999px;font-size:11px;">${isAr ? 'موصى به' : 'Recommended'}</span>
            </div>
            <div style="font-size:13px;line-height:1.7;color:#064e3b;white-space:pre-wrap;font-family:inherit;font-weight:500;">${h(afterText || (isAr ? '(تم التحسين بنجاح)' : '(Enhanced content applied)'))}</div>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;display:flex;justify-content:flex-end;gap:12px;">
          <button onclick="document.getElementById('smartfix-preview-modal').remove()" style="padding:10px 18px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#475569;cursor:pointer;">${isAr ? '✕ إلغاء والتراجع' : 'Cancel'}</button>
          <button id="btn-apply-smartfix-now" style="padding:10px 22px;border:none;border-radius:8px;background:#2563eb;font-size:13px;font-weight:700;color:#fff;cursor:pointer;box-shadow:0 4px 6px -1px rgba(37,99,235,0.2);">${isAr ? '✓ تطبيق التعديل الآن' : 'Apply Proposed Fix'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    document.getElementById('btn-apply-smartfix-now').onclick = () => {
      pushUndo();
      career = JSON.parse(JSON.stringify(draftCareer));
      saveAndRender();
      showSaveIndicator(successMsg || _ct('coach.smart_fix.success', '✓ تم تطبيق التحسين الذكي بنجاح وتحديث النتيجة!'), true);
      document.getElementById('smartfix-preview-modal')?.remove();
      if (currentEditSection) openEditPanel(currentEditSection);
      if (typeof renderExportReview === 'function') renderExportReview();
      if (typeof updateCoachPanel === 'function') updateCoachPanel();
    };
  }

  function extractSectionTextForCompare(cObj, issueId) {
    if (!cObj) return '';
    if (issueId?.includes('summary') || issueId === 'missing-summary' || issueId === 'auto-summary') {
      return cObj.summary || '';
    }
    if (issueId?.includes('skills') || issueId === 'few-skills' || issueId === 'auto-skills') {
      return (cObj.skills?.core || []).join(', ');
    }
    if (issueId?.includes('bullet') || issueId?.includes('exp') || issueId === 'thin-bullet' || issueId === 'auto-bullets') {
      return (cObj.experience || []).map(e => '• ' + e.role + ' at ' + e.company + ':\n  ' + (e.bullets||[]).join('\n  ')).join('\n\n');
    }
    return JSON.stringify(cObj, null, 2);
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
    if (event && event.stopPropagation) event.stopPropagation();
    const existing = el('mob-dropdown-menu');
    if (existing) { existing.remove(); return; }
    const menu = document.createElement('div');
    menu.id = 'mob-dropdown-menu';
    menu.className = 'mob-dropdown-menu';
    menu.innerHTML = `
      <button onclick="Editor.undoAction(); el('mob-dropdown-menu')?.remove();"><span class="icon">↩️</span> <span data-i18n="ed.topbar.undo">تراجع عن آخر تعديل</span></button>
      <button onclick="Editor.setMobileView('coach'); el('mob-dropdown-menu')?.remove();"><span class="icon">🎯</span> <span data-i18n="ed.mobile.coach">المدرب المهني و ATS</span></button>
      <button onclick="Editor.showExportModal(); el('mob-dropdown-menu')?.remove();"><span class="icon">⬇️</span> <span data-i18n="ed.topbar.download">تصدير / تحميل الملف</span></button>
      <a href="landing.html" class="menu-link"><span class="icon">🚪</span> <span data-i18n="ed.topbar.exit">خروج إلى الرئيسية</span></a>
    `;
    document.body.appendChild(menu);
    const closeMenu = (e) => {
      if (!menu.contains(e.target) && e.target?.className !== 'mob-topbar-menu') {
        menu.remove();
        document.removeEventListener('click', closeMenu);
      }
    };
    setTimeout(() => document.addEventListener('click', closeMenu), 10);
  }

  function applyMobileScale() {
    const isMobile = window.matchMedia('(max-width: 1024px)').matches;
    if (!isMobile) return;
    const canvas = el('editor-canvas');
    const paper = el('a4-wrapper');
    if (!canvas || !paper) return;
    if (career && career.meta?.zoomLevel && career.meta.zoomLevel !== 'fit-width' && career.meta.zoomLevel !== 'fit-page') {
      const customScale = parseInt(career.meta.zoomLevel, 10) / 100;
      paper.style.width = '794px';
      paper.style.transform = `scale(${customScale})`;
      paper.style.transformOrigin = 'top center';
      const frame = el('preview-frame');
      const height = frame?.scrollHeight || paper.scrollHeight || 1123;
      paper.style.marginBottom = `${-(height * (1 - customScale))}px`;
      return;
    }
    const availW = Math.max(280, canvas.clientWidth - 16);
    const scale = Math.min(1, availW / 794);
    paper.style.width = '794px';
    paper.style.transform = `scale(${scale})`;
    paper.style.transformOrigin = 'top center';
    const frame = el('preview-frame');
    const height = frame?.scrollHeight || paper.scrollHeight || 1123;
    paper.style.marginBottom = `${-(height * (1 - scale))}px`;
  }

  function updateMobScoreBar() {
    const isMobile = window.matchMedia('(max-width: 1024px)').matches;
    if (!isMobile) return;
    try {
      const result = ATSScorer.score(career);
      const pct = result.percent || 0;
      const label = result.label || (pct >= 75 ? 'ممتازة' : pct >= 50 ? 'جيدة' : 'تحتاج تحسين');
      const fill = el('mob-score-fill');
      const lbl = el('mob-score-label');
      if (fill) {
        fill.style.width = `${pct}%`;
        fill.style.background = pct >= 75 ? '#16a34a' : pct >= 50 ? '#d97706' : '#dc2626';
      }
      if (lbl) lbl.textContent = `تقييم السيرة: ${pct}% (${label})`;
    } catch(e) {}
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
    CareerStorage.save(career);
    renderAll();
    updateMobScoreBar();
    updateTopbarName();
    
    // Update edit panel save button if open
    const saveBtn = el('edit-save-btn');
    if (saveBtn && el('edit-overlay').style.display !== 'none') {
      saveBtn.textContent = 'تم الحفظ ✓';
      saveBtn.style.background = '#16a34a'; // green-600
    }

    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => showSaveIndicator(t('ed.saved', 'Saved ✓'), true), 400);
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
        ind.textContent = _ct('ed.saved_auto', '✓ تم الحفظ تلقائياً');
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

  function printCvOnly() {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    iframe.style.inset = '0';
    iframe.setAttribute('aria-hidden', 'true');
    iframe.onload = () => {
      const win = iframe.contentWindow;
      if (!win) return;
      setTimeout(() => {
        win.focus();
        win.print();
        setTimeout(() => iframe.remove(), 1200);
      }, 500);
    };
    iframe.srcdoc = buildStandaloneCvHtml({ print: true });
    document.body.appendChild(iframe);
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
    closeExportModal();
    printCvOnly();
  }
  function exportJson() { CareerStorage.download(career); }
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
      const full = buildStandaloneCvHtml();
      const blob = new Blob(['\ufeff', full], { type: 'application/msword' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportFilename('.doc');
      a.click();
      URL.revokeObjectURL(url);
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

  async function autoFillStarterCV() {
    pushUndo();
    const isAr = career.meta?.locale === 'ar' || document.documentElement.lang === 'ar';
    const level = career.careerProfile?.level || 'fresh';

    // 1. Summary
    if (!career.professionalSummary || career.professionalSummary.length < 20) {
      const sumObj = (typeof ContentPicker !== 'undefined' && await ContentPicker.getSummary(career));
      career.professionalSummary = sumObj?.text || (isAr ?
        'مهني طموح وحديث التخرج، أمتلك أساساً أكاديمياً متيناً ومهارات تقنية عالية في استخدام الأدوات الحديثة وتحليل البيانات. أتطلع لتوظيف قدراتي في بيئة عمل احترافية تدعم التطور وتساهم في تحقيق أهداف المؤسسة.' :
        'Motivated professional possessing strong foundational knowledge, technical proficiency, and analytical problem-solving skills. Dedicated to adding measurable value within a growth-oriented organization.');
    }

    // 2. Skills
    if (!career.skills || Object.keys(career.skills).length === 0) {
      career.skills = isAr ? {
        'المهارات الأساسية': ['Excel المتقدم', 'إعداد التقارير', 'تحليل البيانات', 'تنظيم العمل'],
        'المهارات الشخصية': ['التواصل الفعال', 'حل المشكلات', 'العمل الجماعي', 'إدارة الوقت']
      } : {
        'Core Skills': ['Advanced Excel', 'Data Analysis', 'Reporting', 'Process Organization'],
        'Soft Skills': ['Effective Communication', 'Problem Solving', 'Teamwork', 'Time Management']
      };
    }

    // 3. Experience / Internship
    if (!career.experience || career.experience.length === 0) {
      if (level === 'fresh') {
        career.experience = [{
          role: isAr ? 'تدريب عملي / مشروع تطبيقي' : 'Practical Training / Capstone Project',
          company: isAr ? 'برنامج التدريب المهني' : 'Professional Development Program',
          period: isAr ? '2024' : '2024',
          bullets: isAr ? [
            'تطبيق المفاهيم المهنية والتحليلية المتقدمة لإنجاز المهام المطلوبة بدقة وكفاءة.',
            'استخدام برامج وتطبيقات الحاسب الآلي لتحليل البيانات وإعداد التقارير الدورية.',
            'التعاون مع الفريق لإنجاز المهام وتحسين جودة المخرجات بنسبة ملحوظة.'
          ] : [
            'Applied professional concepts and analytical methodologies to complete core project tasks efficiently.',
            'Utilized digital software tools to process data and generate accurate reports.',
            'Collaborated with peers to deliver timely results and improve overall output quality.'
          ]
        }];
      } else {
        career.experience = [{
          role: isAr ? 'أخصائي / مسؤول مهني' : 'Professional Specialist',
          company: isAr ? 'شركة رائدة في المجال' : 'Leading Organization',
          period: isAr ? '2022 – الحالي' : '2022 – Present',
          bullets: isAr ? [
            'إدارة وتنفيذ المهام اليومية بكفاءة عالية وفقاً لأفضل الممارسات المهنية ومعايير الجودة.',
            'إعداد وتحليل التقارير الدورية لتقديم توصيات تدعم اتخاذ القرارات الإدارية بشكل دقيق.',
            'تطوير أساليب العمل اليومية مما ساهم في زيادة الإنتاجية وتقليل الوقت المستغرق في إنجاز المهام.'
          ] : [
            'Managed day-to-day operations efficiently in alignment with industry best practices and quality standards.',
            'Prepared comprehensive analytical reports providing actionable recommendations for management.',
            'Streamlined workflows resulting in measurable increases in operational productivity.'
          ]
        }];
      }
    }

    // 4. Education
    if (!career.education || career.education.length === 0) {
      career.education = [{
        degree: isAr ? 'بكالوريوس في التخصص المهني' : 'Bachelor Degree in Professional Field',
        institution: isAr ? 'جامعة معتمدة' : 'Accredited University',
        period: isAr ? '2024' : '2024'
      }];
    }

    // 5. Languages
    if (!career.languages || career.languages.length === 0) {
      career.languages = isAr ? [
        { name: 'العربية', level: 'اللغة الأم' },
        { name: 'الإنجليزية', level: 'جيد جداً (مهني)' }
      ] : [
        { name: 'Arabic', level: 'Native' },
        { name: 'English', level: 'Professional Working Proficiency' }
      ];
    }

    saveAndRender();
    if (typeof showNoticeModal === 'function') {
      showNoticeModal({
        title: isAr ? '✨ تم إنشاء نموذج سيرة ذاتية كامل!' : '✨ Complete Starter Resume Created!',
        body: isAr ?
          'تم ملء السيرة الذاتية بنموذج متكامل واحترافي لمجالك. يمكنك الآن التعديل على أي قسم وتغيير بياناتك بسهولة وسرعة!' :
          'Your resume has been populated with a high-quality starter model. You can now easily edit any field to personalize your information!'
      });
    }
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
    career.meta.showPhoto = show;
    if (show && (!career.personalInfo || !career.personalInfo.photo)) {
      if (!career.personalInfo) career.personalInfo = {};
      career.personalInfo.photo = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80';
    }
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

  function showVersionManagerModal() {
    const old = el('version-manager-modal');
    if (old) old.remove();

    const versions = typeof CareerStorage !== 'undefined' && CareerStorage.listVersions ? CareerStorage.listVersions() : [];
    const activeId = typeof CareerStorage !== 'undefined' && CareerStorage.getActiveVersionId ? CareerStorage.getActiveVersionId() : 'default';
    const isAr = (career.meta?.locale || 'ar') === 'ar';

    const modal = document.createElement('div');
    modal.id = 'version-manager-modal';
    modal.style.cssText = 'display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.75);z-index:999999;backdrop-filter:blur(4px);padding:20px;';
    modal.innerHTML = `
      <div class="modal-card" style="background:#fff;border-radius:16px;max-width:680px;width:100%;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;direction:${isAr ? 'rtl' : 'ltr'};">
        <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;background:#f8fafc;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px;">📂</span>
            <div>
              <h3 style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">${isAr ? 'إدارة النسخ والتخصيص الوظيفي' : 'CV Versions & Job Tailoring'}</h3>
              <div style="font-size:12px;color:#64748b;">${isAr ? 'أنشئ عدة نسخ مخصصة من سيرتك لكل شركة أو وظيفة تتقدم إليها' : 'Manage multiple versions of your resume tailored for different roles'}</div>
            </div>
          </div>
          <button onclick="document.getElementById('version-manager-modal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;">✕</button>
        </div>

        <div style="padding:20px 24px;background:#eff6ff;border-bottom:1px solid #bfdbfe;display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
          <input type="text" id="new-version-name-input" placeholder="${isAr ? 'اسم النسخة الجديدة (مثال: Senior FinTech Tech Lead)...' : 'New version name...'}" style="flex:1;min-width:240px;padding:10px 14px;border:1px solid #3b82f6;border-radius:8px;font-size:13px;outline:none;">
          <button onclick="Editor.handleCreateVersion()" style="padding:10px 18px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 2px 4px rgba(37,99,235,0.2);">
            <span>➕</span> ${isAr ? 'إنشاء وتخصيص نسخة' : 'Duplicate & Tailor'}
          </button>
        </div>

        <div style="padding:24px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:12px;">
          ${versions.map(v => {
            const isActive = v.id === activeId;
            return `
              <div style="border:1px solid ${isActive ? '#86efac' : '#e2e8f0'};border-radius:12px;padding:16px;background:${isActive ? '#f0fdf4' : '#fff'};display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div>
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                    <span style="font-size:15px;font-weight:700;color:#0f172a;">${h(v.name)}</span>
                    ${isActive ? `<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">${isAr ? 'النسخة الحالية' : 'Active'}</span>` : ''}
                  </div>
                  <div style="font-size:11px;color:#64748b;">${isAr ? 'آخر تحديث:' : 'Updated:'} ${new Date(v.updatedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                  ${!isActive ? `<button onclick="Editor.handleSwitchVersion('${v.id}')" style="background:#2563eb;color:#fff;border:none;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">${isAr ? 'انتقال لهذه النسخة ⮐' : 'Switch to this version'}</button>` : ''}
                  ${!isActive && v.id !== 'default' ? `<button onclick="Editor.handleDeleteVersion('${v.id}')" style="background:#fee2e2;color:#dc2626;border:none;padding:8px 12px;border-radius:6px;font-size:12px;cursor:pointer;" title="حذف">🗑️</button>` : ''}
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;display:flex;justify-content:flex-end;">
          <button onclick="document.getElementById('version-manager-modal').remove()" style="padding:10px 20px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#475569;cursor:pointer;">${isAr ? 'إغلاق' : 'Close'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
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
      + '<span style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; background: rgba(255,255,255,0.2); padding: 3px 8px; border-radius: 20px;">🎯 ' + _ct('coach.overview.today_goal', 'هدف اليوم') + '</span>'
      + '<span style="font-size: 11px; font-weight: 700; opacity: 0.9;">' + _ct('coach.overview.remaining', 'المتبقي') + ': ' + ins.todayGoal.remainingTasksCount + ' ' + _ct('coach.overview.tasks', 'مهام') + '</span>'
      + '</div>'
      + '<div style="font-size: 14px; font-weight: 800; line-height: 1.4; margin-bottom: 10px;">'
      + _ct('coach.overview.raise_to', 'ارفع السيرة من {current}% ← {target}%').replace('{current}', ins.todayGoal.currentScore).replace('{target}', ins.todayGoal.targetScore)
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
        + '<div style="font-size:11px;font-weight:800;color:#dc2626;text-transform:uppercase;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">'
        + '<span>🔥 ' + _ct('coach.overview.top_problems', 'أهم 3 مشاكل للتحسين') + '</span>'
        + '</div>'
        + ins.top3Problems.map(function(p, idx) {
          return '<div style="background:#fff;border:1px solid #fee2e2;border-radius:10px;padding:12px;margin-bottom:10px;box-shadow:0 2px 6px rgba(220,38,38,0.05);">'
            + '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:6px;">'
            + '<div style="font-size:13px;font-weight:800;color:#991b1b;display:flex;align-items:center;gap:6px;">'
            + '<span style="background:#fef2f2;color:#dc2626;width:20px;height:20px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-size:11px;flex-shrink:0;">' + (idx + 1) + '</span>'
            + '<span>' + h(p.title) + '</span>'
            + '</div>'
            + (p.points ? '<span style="font-size:11px;font-weight:800;color:#16a34a;background:#dcfce7;padding:2px 6px;border-radius:10px;flex-shrink:0;">' + h(p.points) + '</span>' : '')
            + '</div>'
            + '<div style="font-size:12px;color:#475569;margin-bottom:8px;line-height:1.4;">' + h(p.detail) + '</div>'
            + (p.why ? '<div style="background:#f8fafc;border-left:' + (isRtl ? 'none' : '3px solid #64748b') + ';border-right:' + (isRtl ? '3px solid #64748b' : 'none') + ';padding:8px 10px;border-radius:6px;font-size:11px;color:#334155;line-height:1.4;margin-bottom:10px;"><strong style="color:#0f172a;">💡 ' + _ct('coach.overview.why', 'لماذا؟') + '</strong> ' + h(p.why) + '</div>' : '')
            + '<button style="width:100%;background:#dc2626;color:#fff;border:none;border-radius:6px;padding:8px 12px;font-size:12px;font-weight:700;cursor:pointer;transition:background 0.15s;display:flex;align-items:center;justify-content:center;gap:6px;" onmouseover="this.style.background=\'#b91c1c\'" onmouseout="this.style.background=\'#dc2626\'" onclick="Editor.triggerSmartFix(\'' + h(p.fixAction || 'edit-personal') + '\', \'' + h(p.sectionKey) + '\', \'' + h(p.id) + '\')">'
            + '⚡ ' + (p.actionLabel || _ct('coach.overview.smart_fix', 'إصلاح ذكي'))
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
        + (m.why ? '<div style="font-size:11px;color:#3b82f6;line-height:1.4;">💡 <strong>' + _ct('coach.overview.why', 'لماذا؟') + '</strong> ' + h(m.why) + '</div>' : '')
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
        + '</div>';

      if (ats.missingKeywords.length > 0) {
        html += '<div style="margin-bottom:16px;">'
          + '<div style="font-size:11px;font-weight:700;color:#dc2626;margin-bottom:8px;">❌ ' + _ct('coach.ats.missing_jd_kw', 'كلمات مفتاحية مفقودة من إعلان الوظيفة:') + '</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:6px;">'
          + ats.missingKeywords.map(function(kw) {
            return '<span style="background:#fef2f2;border:1px solid #fecaca;color:#991b1b;padding:4px 8px;border-radius:14px;font-size:11px;font-weight:600;cursor:pointer;" onclick="Editor.addKeywordWithConfirm(\'' + h(kw) + '\', \'skill\')" title="' + _ct('coach.ats.click_add', 'اضغط للإضافة') + '">+ ' + h(kw) + '</span>';
          }).join('') + '</div></div>';
      }

      if (ats.foundKeywords.length > 0) {
        html += '<div style="margin-bottom:16px;">'
          + '<div style="font-size:11px;font-weight:700;color:#16a34a;margin-bottom:8px;">✅ ' + _ct('coach.ats.found_jd_kw', 'كلمات متطابقة بنجاح:') + '</div>'
          + '<div style="display:flex;flex-wrap:wrap;gap:6px;">'
          + ats.foundKeywords.map(function(kw) {
            return '<span style="background:#f0fdf4;border:1px solid #bbf7d0;color:#166534;padding:4px 8px;border-radius:14px;font-size:11px;font-weight:600;">✓ ' + h(kw) + '</span>';
          }).join('') + '</div></div>';
      }
    } else {
      html += '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px;margin-bottom:16px;">';
      (ats.readinessChecklist || []).forEach(function(item) {
        html += '<div style="font-size:12px;color:#334155;margin-bottom:6px;display:flex;align-items:center;gap:6px;">'
          + '<span style="color:' + (item.ok ? '#16a34a' : '#dc2626') + ';font-weight:800;">' + (item.ok ? '✓' : '✕') + '</span> '
          + h(item.label) + '</div>';
      });
      html += '</div>';

      const sugSkills = ats.commonSkills || [];
      if (sugSkills.length > 0) {
        html += '<div style="font-size:11px;font-weight:700;color:#475569;margin-bottom:10px;">💡 ' + _ct('coach.ats.common_skills','المهارات الشائعة في مجالك (أضف ما تتقنه):') + '</div>'
          + '<div style="display:flex;flex-direction:column;gap:8px;margin-bottom:16px;">';
        sugSkills.forEach(function(kw) {
          html += '<div id="kw-card-' + h(kw) + '" style="display:flex;justify-content:space-between;align-items:center;background:#fff;border:1px solid #e2e8f0;padding:8px 12px;border-radius:6px;">'
            + '<span style="font-size:12px;font-weight:600;color:#0f172a;">' + h(kw) + '</span>'
            + '<button style="background:none;border:none;color:#2563eb;font-size:11px;font-weight:700;cursor:pointer;padding:4px;" onclick="Editor.addKeywordWithConfirm(\'' + h(kw) + '\', \'skill\')">' + _ct('coach.ats.add','+ Add') + '</button>'
            + '</div>';
        });
        html += '</div>';
      }
    }

    // Target JD Paste Box
    const curJD = career.meta?.targetJD || '';
    html += '<div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:10px;padding:12px;margin-top:10px;">'
      + '<div style="font-size:11px;font-weight:800;color:#1e40af;margin-bottom:6px;">🎯 ' + _ct('coach.ats.jd_target_title', 'فحص مطابقة إعلان وظيفة (Job Description)') + '</div>'
      + '<div style="font-size:11px;color:#1e3a8a;line-height:1.4;margin-bottom:8px;">' + _ct('coach.ats.jd_target_desc', 'الصق نص إعلان الوظيفة هنا لحساب نسبة المطابقة الحقيقية ومعرفة الكلمات المفقودة في سيرتك.') + '</div>'
      + '<textarea id="coach-jd-input" rows="3" placeholder="' + _ct('coach.ats.jd_placeholder', 'الصق متطلبات الوظيفة هنا...') + '" style="width:100%;padding:8px;border:1px solid #93c5fd;border-radius:6px;font-size:11px;margin-bottom:8px;resize:vertical;">' + h(curJD) + '</textarea>'
      + '<button style="width:100%;background:#2563eb;color:#fff;border:none;padding:8px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;transition:background 0.15s;" onmouseover="this.style.background=\'#1d4ed8\'" onmouseout="this.style.background=\'#2563eb\'" onclick="Editor.applyJDMatch()">' + _ct('coach.ats.analyze_jd', '🔍 تحليل ومطابقة الوظيفة') + '</button>'
      + '</div>';

    html += '</div>';
    panel.innerHTML = html;
  }

  function addKeywordWithConfirm(keyword, type) {
    const card = el('kw-card-' + keyword);
    if (!card) return;
    card.innerHTML = '<div style="font-size:11px;color:#334155;margin-bottom:6px;">' + _ct('coach.ats.do_you_have_exp','Do you have actual experience with {keyword}?').replace('{keyword}', h(keyword)) + '</div>'
      + '<div style="display:flex;gap:6px;">'
      + '<button style="flex:1;background:#16a34a;color:#fff;border:none;padding:6px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;" onclick="Editor.confirmAddKeyword(\'' + h(keyword) + '\', \'' + type + '\')">' + _ct('coach.ats.yes_add','Yes, add') + '</button>'
      + '<button style="flex:1;background:#f1f5f9;color:#475569;border:1px solid #cbd5e1;padding:6px;border-radius:4px;font-size:11px;font-weight:700;cursor:pointer;" onclick="Editor.cancelAddKeyword(\'' + h(keyword) + '\')">' + _ct('coach.ats.no','No') + '</button>'
      + '</div>';
  }

  function confirmAddKeyword(keyword, type) {
    const card = el('kw-card-' + keyword);
    if (card) {
      card.innerHTML = '<span style="font-size:12px;color:#16a34a;font-weight:600;">✓ ' + _ct('coach.ats.added','Added') + '</span>';
      setTimeout(function() { if (card.parentNode) card.remove(); }, 2000);
    }
    pushUndo();
    const category = _ct('coach.ats.skills_category','Core Skills');
    career.skills = career.skills || {};
    career.skills[category] = Array.from(new Set((career.skills[category] || []).concat([keyword])));
    saveAndRender();
  }

  function cancelAddKeyword(keyword) {
    const card = el('kw-card-' + keyword);
    if (card) {
      card.innerHTML = '<span style="font-size:12px;font-weight:600;color:#0f172a;opacity:0.4;">' + h(keyword) + '</span>';
      setTimeout(function() { if (card.parentNode) card.remove(); }, 1500);
    }
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
    if (jdText.length < 15) {
      alert(_ct('coach.ats.jd_too_short', 'الرجاء إدخال نص إعلان وظيفة واضح (على الأقل 15 حرف) لتحليله.'));
      return;
    }
    career.meta = career.meta || {};
    career.meta.targetJD = jdText;

    // Simple keyword extraction for score logic
    const words = jdText.toLowerCase().replace(/[^a-z0-9أ-ي\s]/g, ' ').split(/\s+/).filter(w => w.length > 3 && !['with','and','for','from','that','this','have','will','your','when','where','what','which','who','whom','whose','إلى','على','في','من','عن','مع','هذا','تلك','التي','الذي','كل'].includes(w));
    const uniqueJDWords = Array.from(new Set(words));
    
    const allCvText = JSON.stringify(career).toLowerCase();
    const found = [];
    const missing = [];
    uniqueJDWords.forEach(w => {
      if (allCvText.includes(w)) found.push(w);
      else missing.push(w);
    });

    career.meta.jdMatchScore = uniqueJDWords.length ? Math.round((found.length / uniqueJDWords.length) * 100) : 75;
    career.meta.jdFoundKeywords = found.slice(0, 12);
    career.meta.jdMissingKeywords = missing.slice(0, 12);

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
    showExample,
    aiImprove, aiShorten, aiProfessional, aiTranslate, aiSuggestSkills, handleAIAction, applyCoachFix,
    undoAction, redoAction,
    saveAndRender, renderPreview, handleZoomSelect, toggleGroup,
    showExportModal, closeExportModal,
    exportPdf, exportJson, exportHtml, exportPng, exportDocx,
    switchCoachTab,
  };
})();

document.addEventListener('DOMContentLoaded', () => Editor.init());

