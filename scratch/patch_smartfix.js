const fs = require('fs');
let s = fs.readFileSync('app/assets/editor.js', 'utf8');

// 1. Replace applyCoachFix with preview-capable version
const oldApplyCoachFix = `  async function applyCoachFix(issueId) {
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
  }`;

const newApplyCoachFix = `  function showSmartFixPreviewModal(draftCareer, beforeText, afterText, title, successMsg) {
    const oldModal = document.getElementById('smartfix-preview-modal');
    if (oldModal) oldModal.remove();

    const isAr = (career.meta?.locale || 'ar') === 'ar';
    const modal = document.createElement('div');
    modal.id = 'smartfix-preview-modal';
    modal.style.cssText = 'display:flex;align-items:center;justify-content:center;position:fixed;top:0;left:0;right:0;bottom:0;background:rgba(15,23,42,0.75);z-index:999999;backdrop-filter:blur(4px);padding:20px;';
    modal.innerHTML = \`
      <div class="modal-card" style="background:#fff;border-radius:16px;max-width:760px;width:100%;max-height:85vh;display:flex;flex-direction:column;box-shadow:0 25px 50px -12px rgba(0,0,0,0.25);overflow:hidden;direction:\${isAr ? 'rtl' : 'ltr'};">
        <div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;background:#f8fafc;">
          <div style="display:flex;align-items:center;gap:10px;">
            <span style="font-size:24px;">✨</span>
            <div>
              <h3 style="margin:0;font-size:18px;font-weight:700;color:#0f172a;">\${h(title || (isAr ? 'معاينة التحسين المقترح بالمقارنة' : 'SmartFix Before & After Preview'))}</h3>
              <div style="font-size:12px;color:#64748b;">\${isAr ? 'راجع التعديل المطور بالذكاء الاصطناعي وقارنه بالنص الحالي قبل اعتماده' : 'Review the AI enhanced content against your current content before applying'}</div>
            </div>
          </div>
          <button onclick="document.getElementById('smartfix-preview-modal').remove()" style="background:none;border:none;font-size:20px;cursor:pointer;color:#64748b;">✕</button>
        </div>
        <div style="padding:24px;overflow-y:auto;flex:1;display:grid;grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));gap:20px;">
          <div style="border:1px solid #f1f5f9;border-radius:12px;padding:16px;background:#f8fafc;display:flex;flex-direction:column;">
            <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:12px;display:flex;align-items:center;gap:6px;">
              <span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#94a3b8;"></span> \${isAr ? 'الوضع الحالي (Before)' : 'Current Content (Before)'}
            </div>
            <div style="font-size:13px;line-height:1.7;color:#334155;white-space:pre-wrap;font-family:inherit;">\${h(beforeText || (isAr ? '(قسم فارغ أو غير ممتلئ)' : '(Empty section)'))}</div>
          </div>
          <div style="border:2px solid #10b981;border-radius:12px;padding:16px;background:#f0fdf4;display:flex;flex-direction:column;position:relative;">
            <div style="font-size:12px;font-weight:700;color:#047857;margin-bottom:12px;display:flex;align-items:center;justify-content:space-between;">
              <span style="display:flex;align-items:center;gap:6px;"><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:#10b981;"></span> \${isAr ? 'الاقتراح المطور (AI Enhanced)' : 'AI Proposed Content'}</span>
              <span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:999px;font-size:11px;">\${isAr ? 'موصى به' : 'Recommended'}</span>
            </div>
            <div style="font-size:13px;line-height:1.7;color:#064e3b;white-space:pre-wrap;font-family:inherit;font-weight:500;">\${h(afterText || (isAr ? '(تم التحسين بنجاح)' : '(Enhanced content applied)'))}</div>
          </div>
        </div>
        <div style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;display:flex;justify-content:flex-end;gap:12px;">
          <button onclick="document.getElementById('smartfix-preview-modal').remove()" style="padding:10px 18px;border:1px solid #cbd5e1;border-radius:8px;background:#fff;font-size:13px;font-weight:600;color:#475569;cursor:pointer;">\${isAr ? '✕ إلغاء والتراجع' : 'Cancel'}</button>
          <button id="btn-apply-smartfix-now" style="padding:10px 22px;border:none;border-radius:8px;background:#2563eb;font-size:13px;font-weight:700;color:#fff;cursor:pointer;box-shadow:0 4px 6px -1px rgba(37,99,235,0.2);">\${isAr ? '✓ تطبيق التعديل الآن' : 'Apply Proposed Fix'}</button>
        </div>
      </div>
    \`;
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
      return (cObj.experience || []).map(e => \`• \${e.role} at \${e.company}:\n  \${(e.bullets||[]).join('\n  ')}\`).join('\n\n');
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
  }`;

if (s.includes(oldApplyCoachFix)) {
  s = s.replace(oldApplyCoachFix, newApplyCoachFix);
  console.log('Replaced oldApplyCoachFix successfully');
} else {
  console.log('oldApplyCoachFix not found EXACTLY, checking partials...');
}

// 2. Replace triggerSmartFix with preview-capable version
const oldTriggerSmartFix = `  async function triggerSmartFix(fixAction, sectionKey, issueId) {
    if (!career) return;
    if (fixAction === 'auto-summary') {
      if (typeof AICoach !== 'undefined' && AICoach.applyQuickFix) {
        await AICoach.applyQuickFix(career, issueId || 'missing-summary');
        saveAndRender();
        alert(_ct('coach.smart_fix.summary_success', '✓ تم إنشاء/تحسين النبذة المهنية بنجاح وتحديث النتيجة!'));
        return;
      }
    } else if (fixAction === 'auto-bullets') {
      if (typeof AICoach !== 'undefined' && AICoach.applyQuickFix) {
        await AICoach.applyQuickFix(career, issueId || 'thin-bullet');
        saveAndRender();
        alert(_ct('coach.smart_fix.bullets_success', '✓ تم تطوير نقاط الخبرة وصياغة الإنجازات بنجاح!'));
        return;
      }
    } else if (fixAction === 'auto-skills') {
      if (typeof AICoach !== 'undefined' && AICoach.applyQuickFix) {
        await AICoach.applyQuickFix(career, issueId || 'few-skills');
        saveAndRender();
        alert(_ct('coach.smart_fix.skills_success', '✓ تمت إضافة المهارات المتخصصة الشائعة بنجاح!'));
        return;
      }
    }
    // Fallback or edit-* actions: directly open the panel
    openEditPanel(sectionKey || 'personalInfo');
  }`;

const newTriggerSmartFix = `  async function triggerSmartFix(fixAction, sectionKey, issueId) {
    if (!career) return;
    if (['auto-summary', 'auto-bullets', 'auto-skills'].includes(fixAction)) {
      const targetId = issueId || (fixAction === 'auto-summary' ? 'missing-summary' : fixAction === 'auto-bullets' ? 'thin-bullet' : 'few-skills');
      await applyCoachFix(targetId);
      return;
    }
    // Fallback or edit-* actions: directly open the panel
    openEditPanel(sectionKey || 'personalInfo');
  }`;

if (s.includes(oldTriggerSmartFix)) {
  s = s.replace(oldTriggerSmartFix, newTriggerSmartFix);
  console.log('Replaced oldTriggerSmartFix successfully');
} else {
  console.log('oldTriggerSmartFix not found EXACTLY');
}

// 3. Export triggerSmartFix in return { ... }
if (!s.includes('triggerSmartFix,') && !s.includes('triggerSmartFix\n')) {
  s = s.replace('applyCoachFix,\n', 'applyCoachFix, triggerSmartFix,\n');
  console.log('Exported triggerSmartFix successfully');
}

fs.writeFileSync('app/assets/editor.js', s, 'utf8');
console.log('Patch complete.');
