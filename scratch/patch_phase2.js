const fs = require('fs');
let s = fs.readFileSync('app/assets/editor.js', 'utf8');

// 1. Update showSaveIndicator
const oldShowSave = `  function showSaveIndicator(msg, fade = false) {
    const ind = el('save-indicator');
    if (!ind) return;
    ind.textContent = msg;
    ind.className = 'save-indicator ' + (fade ? 'saved' : 'saving');
    if (fade) setTimeout(() => { ind.textContent = ''; ind.className = 'save-indicator'; }, 2500);
  }`;

const newShowSave = `  function showSaveIndicator(msg, fade = false) {
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
  }`;

if (s.includes(oldShowSave)) {
  s = s.replace(oldShowSave, newShowSave);
  console.log('Replaced showSaveIndicator successfully');
} else {
  console.log('oldShowSave not found exactly, checking...');
}

// 2. Update updateTopbarName to update active-version-badge
const oldUpdateTopbar = `  function updateTopbarName() {
    const nameEl = el('topbar-name');
    const displayTitle = resumeDisplayTitle();
    if (nameEl) nameEl.textContent = displayTitle;
    const mobName = el('mob-topbar-name');
    if (mobName) mobName.textContent = displayTitle;
  }`;

const newUpdateTopbar = `  function updateTopbarName() {
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
  }`;

if (s.includes(oldUpdateTopbar)) {
  s = s.replace(oldUpdateTopbar, newUpdateTopbar);
  console.log('Replaced updateTopbarName successfully');
} else {
  console.log('oldUpdateTopbar not found exactly');
}

// 3. Update setMobileView to toggle #mob-preview-controls and handle scale
const oldSetMobileView = `  function setMobileView(view) {
    if (currentMobileView === view) return;
    
    // Save current scroll
    if (currentMobileView === 'edit') editScrollPos = window.scrollY;
    if (currentMobileView === 'preview') previewScrollPos = window.scrollY;

    currentMobileView = view;
    const body = document.body;
    body.classList.remove('mobile-edit-mode', 'mobile-preview-mode', 'mobile-coach-mode');

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
    if (coachBtn) coachBtn.classList.toggle('active', view === 'coach');`;

const newSetMobileView = `  function setMobileView(view) {
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
    if (coachBtn) coachBtn.classList.toggle('active', view === 'coach');`;

if (s.includes(oldSetMobileView)) {
  s = s.replace(oldSetMobileView, newSetMobileView);
  console.log('Replaced setMobileView successfully');
} else {
  console.log('oldSetMobileView not found exactly');
}

// 4. Update applyMobileScale to respect zoomLevel if set
const oldApplyScale = `  function applyMobileScale() {
    const isMobile = window.matchMedia('(max-width: 1024px)').matches;
    if (!isMobile) return;
    const canvas = el('editor-canvas');
    const paper = el('a4-wrapper');
    if (!canvas || !paper) return;
    const availW = Math.max(280, canvas.clientWidth - 16);
    const scale = Math.min(1, availW / 794);
    paper.style.width = '794px';
    paper.style.transform = \`scale(\${scale})\`;
    paper.style.transformOrigin = 'top center';
    const frame = el('preview-frame');
    const height = frame?.scrollHeight || paper.scrollHeight || 1123;
    paper.style.marginBottom = \`\${-(height * (1 - scale))}px\`;
  }`;

const newApplyScale = `  function applyMobileScale() {
    const isMobile = window.matchMedia('(max-width: 1024px)').matches;
    if (!isMobile) return;
    const canvas = el('editor-canvas');
    const paper = el('a4-wrapper');
    if (!canvas || !paper) return;
    if (career && career.meta?.zoomLevel && career.meta.zoomLevel !== 'fit-width' && career.meta.zoomLevel !== 'fit-page') {
      const customScale = parseInt(career.meta.zoomLevel, 10) / 100;
      paper.style.width = '794px';
      paper.style.transform = \`scale(\${customScale})\`;
      paper.style.transformOrigin = 'top center';
      const frame = el('preview-frame');
      const height = frame?.scrollHeight || paper.scrollHeight || 1123;
      paper.style.marginBottom = \`\${-(height * (1 - customScale))}px\`;
      return;
    }
    const availW = Math.max(280, canvas.clientWidth - 16);
    const scale = Math.min(1, availW / 794);
    paper.style.width = '794px';
    paper.style.transform = \`scale(\${scale})\`;
    paper.style.transformOrigin = 'top center';
    const frame = el('preview-frame');
    const height = frame?.scrollHeight || paper.scrollHeight || 1123;
    paper.style.marginBottom = \`\${-(height * (1 - scale))}px\`;
  }`;

if (s.includes(oldApplyScale)) {
  s = s.replace(oldApplyScale, newApplyScale);
  console.log('Replaced applyMobileScale successfully');
} else {
  console.log('oldApplyScale not found exactly');
}

// 5. Add Version Manager functions right before switchCoachTab
const versionFunctions = `  function showVersionManagerModal() {
    const old = el('version-manager-modal');
    if (old) old.remove();

    const versions = typeof CareerStorage !== 'undefined' && CareerStorage.listVersions ? CareerStorage.listVersions() : [];
    const activeId = typeof CareerStorage !== 'undefined' && CareerStorage.getActiveVersionId ? CareerStorage.getActiveVersionId() : 'default';
    const isAr = (career.meta?.locale || 'ar') === 'ar';

    const modal = document.createElement('div');
    modal.id = 'version-manager-modal';
    modal.style.cssText = 'display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.75);z-index:999999;backdrop-filter:blur(4px);padding:20px;';
    modal.innerHTML = \`
      <div class="modal-card" style="background:#fff;border-radius:16px;max-width:680px;width:100%;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;direction:\${isAr ? 'rtl' : 'ltr'};">
        <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;background:#f8fafc;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px;">📂</span>
            <div>
              <h3 style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">\${isAr ? 'إدارة النسخ والتخصيص الوظيفي' : 'CV Versions & Job Tailoring'}</h3>
              <div style="font-size:12px;color:#64748b;">\${isAr ? 'أنشئ عدة نسخ مخصصة من سيرتك لكل شركة أو وظيفة تتقدم إليها' : 'Manage multiple versions of your resume tailored for different roles'}</div>
            </div>
          </div>
          <button onclick="document.getElementById('version-manager-modal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;">✕</button>
        </div>

        <div style="padding:20px 24px;background:#eff6ff;border-bottom:1px solid #bfdbfe;display:flex;flex-wrap:wrap;gap:10px;align-items:center;">
          <input type="text" id="new-version-name-input" placeholder="\${isAr ? 'اسم النسخة الجديدة (مثال: Senior FinTech Tech Lead)...' : 'New version name...'}" style="flex:1;min-width:240px;padding:10px 14px;border:1px solid #3b82f6;border-radius:8px;font-size:13px;outline:none;">
          <button onclick="Editor.handleCreateVersion()" style="padding:10px 18px;background:#2563eb;color:#fff;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;box-shadow:0 2px 4px rgba(37,99,235,0.2);">
            <span>➕</span> \${isAr ? 'إنشاء وتخصيص نسخة' : 'Duplicate & Tailor'}
          </button>
        </div>

        <div style="padding:24px;overflow-y:auto;flex:1;display:flex;flex-direction:column;gap:12px;">
          \${versions.map(v => {
            const isActive = v.id === activeId;
            return \`
              <div style="border:1px solid \${isActive ? '#86efac' : '#e2e8f0'};border-radius:12px;padding:16px;background:\${isActive ? '#f0fdf4' : '#fff'};display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div>
                  <div style="display:flex;align-items:center;gap:8px;margin-bottom:4px;">
                    <span style="font-size:15px;font-weight:700;color:#0f172a;">\${h(v.name)}</span>
                    \${isActive ? \`<span style="background:#dcfce7;color:#166534;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:700;">\${isAr ? 'النسخة الحالية' : 'Active'}</span>\` : ''}
                  </div>
                  <div style="font-size:11px;color:#64748b;">\${isAr ? 'آخر تحديث:' : 'Updated:'} \${new Date(v.updatedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
                </div>
                <div style="display:flex;align-items:center;gap:8px;">
                  \${!isActive ? \`<button onclick="Editor.handleSwitchVersion('\${v.id}')" style="background:#2563eb;color:#fff;border:none;padding:8px 14px;border-radius:6px;font-size:12px;font-weight:700;cursor:pointer;">\${isAr ? 'انتقال لهذه النسخة ⮐' : 'Switch to this version'}</button>\` : ''}
                  \${!isActive && v.id !== 'default' ? \`<button onclick="Editor.handleDeleteVersion('\${v.id}')" style="background:#fee2e2;color:#dc2626;border:none;padding:8px 12px;border-radius:6px;font-size:12px;cursor:pointer;" title="حذف">🗑️</button>\` : ''}
                </div>
              </div>
            \`;
          }).join('')}
        </div>

        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;display:flex;justify-content:flex-end;">
          <button onclick="document.getElementById('version-manager-modal').remove()" style="padding:10px 20px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#475569;cursor:pointer;">\${isAr ? 'إغلاق' : 'Close'}</button>
        </div>
      </div>
    \`;
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

  function switchCoachTab(`;

if (s.includes('  function switchCoachTab(')) {
  s = s.replace('  function switchCoachTab(', versionFunctions + 'switchCoachTab(');
  console.log('Added Version Manager functions successfully');
} else {
  console.log('switchCoachTab not found');
}

// 6. Export the new functions
if (!s.includes('showVersionManagerModal,')) {
  s = s.replace('switchCoachTab,\n  };', 'switchCoachTab,\n    showVersionManagerModal, handleCreateVersion, handleSwitchVersion, handleDeleteVersion,\n  };');
  console.log('Exported Version Manager functions successfully');
}

fs.writeFileSync('app/assets/editor.js', s, 'utf8');
console.log('Phase 2 patch complete.');
