/**
 * Production browser AI client.
 * Sends task-based, privacy-minimized payloads only to the same-origin server.
 */
const AIClient = (function () {
  const SESSION_KEY = 'cv_studio_ai_session';

  function configured() { return true; }

  function sessionId() {
    let value = sessionStorage.getItem(SESSION_KEY);
    if (!value) {
      const bytes = new Uint8Array(18);
      crypto.getRandomValues(bytes);
      value = Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('');
      sessionStorage.setItem(SESSION_KEY, value);
    }
    return value;
  }

  function profile(career) {
    return {
      field: career?.careerProfile?.field || 'other',
      specialization: career?.careerProfile?.specialization || '',
      level: career?.careerProfile?.level || 'junior',
      years: career?.careerProfile?.years || '',
      targetTitle: career?.personalInfo?.title || ''
    };
  }

  function skillList(career) {
    return Object.values(career?.skills || {}).flat().map(String).filter(Boolean).slice(0, 24);
  }

  function experience(career) {
    return (career?.experience || []).slice(0, 8).map(item => ({
      role: item.role || '',
      bullets: (item.bullets || []).slice(0, 8)
    }));
  }

  function locale(career) {
    return career?.meta?.locale === 'ar' ? 'ar' : 'en';
  }

  function escapeHtml(value) {
    return String(value ?? '').replace(/[&<>"']/g, ch => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[ch]));
  }

  function profileValueLabel(kind, value, isAr) {
    const fieldsAr = {
      accountant: 'المحاسبة', developer: 'البرمجة', designer: 'التصميم', graphic_designer: 'التصميم الجرافيكي',
      ui_ux_designer: 'تصميم تجربة المستخدم', marketing: 'التسويق', teacher: 'التعليم', doctor: 'الطب',
      nurse: 'التمريض', pharmacist: 'الصيدلة', lawyer: 'القانون', hr: 'الموارد البشرية', sales: 'المبيعات',
      data_analyst: 'تحليل البيانات', project_manager: 'إدارة المشاريع', business_analyst: 'تحليل الأعمال', other: 'مجال آخر'
    };
    const levelsAr = { fresh: 'حديث التخرج', junior: 'مبتدئ', mid: 'متوسط الخبرة', senior: 'خبير / قيادي' };
    if (!isAr) return String(value || '').replace(/_/g, ' ');
    if (kind === 'field') return fieldsAr[value] || String(value || '').replace(/_/g, ' ');
    if (kind === 'level') return levelsAr[value] || String(value || '').replace(/_/g, ' ');
    return String(value || '');
  }

  function taskCopy(payload, isAr) {
    const labels = {
      summary: isAr ? 'إنشاء نبذة مهنية' : 'Create professional summary',
      improve_text: isAr ? 'تحسين النص المحدد' : 'Improve selected text',
      improve_bullets: isAr ? 'تحسين نقاط الخبرة' : 'Improve experience bullets',
      suggest_skills: isAr ? 'اقتراح مهارات مرتبطة بالوظيفة' : 'Suggest role-related skills',
      translate: isAr ? 'ترجمة النص المحدد' : 'Translate selected text'
    };
    return labels[payload.task] || (isAr ? 'طلب مساعدة مهنية' : 'Professional assistance request');
  }

  function previewPayload(payload) {
    if (typeof AISettings === 'undefined' || !AISettings.shouldShowPreview()) return Promise.resolve(true);
    const isAr = payload.locale === 'ar';
    const existing = document.getElementById('ai-request-preview-modal');
    if (existing) existing.remove();

    const profileItems = [
      payload.profile?.field && (isAr ? `المجال: ${profileValueLabel('field', payload.profile.field, true)}` : `Field: ${profileValueLabel('field', payload.profile.field, false)}`),
      payload.profile?.specialization && (isAr ? `التخصص: ${payload.profile.specialization}` : `Specialization: ${payload.profile.specialization}`),
      payload.profile?.level && (isAr ? `المستوى: ${profileValueLabel('level', payload.profile.level, true)}` : `Level: ${profileValueLabel('level', payload.profile.level, false)}`),
      payload.profile?.targetTitle && (isAr ? `المسمى المستهدف: ${payload.profile.targetTitle}` : `Target title: ${payload.profile.targetTitle}`)
    ].filter(Boolean);
    const skillsCount = Array.isArray(payload.existingSkills) ? payload.existingSkills.length : 0;
    const experienceCount = Array.isArray(payload.experience) ? payload.experience.length : 0;
    const textPreview = String(payload.currentText || '').trim().slice(0, 360);

    return new Promise(resolve => {
      const modal = document.createElement('div');
      modal.id = 'ai-request-preview-modal';
      modal.className = 'modal-overlay ai-request-preview-overlay';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-box ai-request-preview-box" role="dialog" aria-modal="true" aria-labelledby="ai-request-preview-title">
          <div class="ai-request-preview-head">
            <div class="ai-request-preview-icon" aria-hidden="true">✦</div>
            <div>
              <span>${isAr ? 'قبل إرسال الطلب' : 'Before sending'}</span>
              <h3 id="ai-request-preview-title">${escapeHtml(taskCopy(payload, isAr))}</h3>
              <p>${isAr ? 'راجع نوع المعلومات المهنية التي سيستخدمها المساعد. لن نرسل بيانات التواصل.' : 'Review the professional context the assistant will use. Contact details are not sent.'}</p>
            </div>
            <button type="button" class="ai-request-preview-close" data-action="cancel" aria-label="${isAr ? 'إغلاق' : 'Close'}">×</button>
          </div>
          <div class="ai-request-preview-content">
            <div class="ai-request-safe-note">
              <strong>${isAr ? 'بيانات مستبعدة تلقائيًا' : 'Automatically excluded'}</strong>
              <span>${isAr ? 'الاسم، البريد الإلكتروني، رقم الهاتف، العنوان والروابط.' : 'Name, email, phone number, address, and links.'}</span>
            </div>
            ${profileItems.length ? `<div class="ai-request-preview-section"><h4>${isAr ? 'السياق المهني' : 'Professional context'}</h4><div class="ai-request-chip-list">${profileItems.map(item => `<span>${escapeHtml(item)}</span>`).join('')}</div></div>` : ''}
            <div class="ai-request-preview-section">
              <h4>${isAr ? 'المحتوى المستخدم في هذا الطلب' : 'Content used for this request'}</h4>
              <div class="ai-request-stat-grid">
                <div><strong>${skillsCount}</strong><span>${isAr ? 'مهارة حالية' : 'current skills'}</span></div>
                <div><strong>${experienceCount}</strong><span>${isAr ? 'خبرة وظيفية' : 'experience entries'}</span></div>
                <div><strong>${textPreview ? 1 : 0}</strong><span>${isAr ? 'نص محدد' : 'selected text'}</span></div>
              </div>
            </div>
            ${textPreview ? `<details class="ai-request-text-details"><summary>${isAr ? 'معاينة النص المطلوب تحسينه' : 'Preview the text being improved'}</summary><div>${escapeHtml(textPreview)}${String(payload.currentText || '').length > 360 ? '…' : ''}</div></details>` : ''}
            <label class="ai-request-preview-toggle"><input type="checkbox" id="ai-request-hide-next"> <span>${isAr ? 'لا تعرض هذه المعاينة في الطلبات القادمة' : 'Do not show this preview for future requests'}</span></label>
          </div>
          <div class="ai-request-preview-actions">
            <button type="button" class="secondary" data-action="cancel">${isAr ? 'إلغاء' : 'Cancel'}</button>
            <button type="button" class="primary" data-action="send">${isAr ? 'إرسال للمساعد' : 'Send to assistant'}</button>
          </div>
        </div>`;
      document.body.appendChild(modal);

      const finish = accepted => {
        if (accepted && document.getElementById('ai-request-hide-next')?.checked && typeof AISettings !== 'undefined') {
          AISettings.setPromptPreview(false);
        }
        modal.remove();
        resolve(accepted);
      };
      modal.addEventListener('click', event => {
        const action = event.target?.closest?.('[data-action]')?.dataset?.action;
        if (event.target === modal || action === 'cancel') finish(false);
        if (action === 'send') finish(true);
      });
      modal.addEventListener('keydown', event => {
        if (event.key === 'Escape') finish(false);
      });
      modal.querySelector('[data-action="send"]')?.focus();
    });
  }

  async function request(payload) {
    if (typeof AISettings !== 'undefined' && !(await AISettings.ensureConsent())) return null;
    if (!(await previewPayload(payload))) return null;

    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      credentials: 'same-origin',
      headers: {
        'Content-Type': 'application/json',
        'X-CV-Client': 'web-v1',
        'X-CV-Session': sessionId()
      },
      body: JSON.stringify(payload)
    });
    const data = await response.json().catch(() => ({}));
    if (data?.fallback) return null;
    if (!response.ok || data?.error) {
      const error = new Error(String(data?.error || `AI request failed (${response.status})`));
      error.status = response.status;
      throw error;
    }
    return data?.text?.trim() || null;
  }

  async function generateSummary(career) {
    return request({
      task: 'summary',
      locale: locale(career),
      profile: profile(career),
      existingSkills: skillList(career)
    });
  }

  async function improveText(career, text, instruction) {
    const looksLikeTranslation = /^translate\b/i.test(String(instruction || '').trim());
    return request({
      task: looksLikeTranslation ? 'translate' : 'improve_text',
      locale: looksLikeTranslation ? (locale(career) === 'ar' ? 'en' : 'ar') : locale(career),
      profile: profile(career),
      existingSkills: skillList(career),
      currentText: String(text || '').slice(0, 5000),
      instruction: looksLikeTranslation ? '' : String(instruction || '').slice(0, 500)
    });
  }

  async function improveBullets(career) {
    const raw = await request({
      task: 'improve_bullets',
      locale: locale(career),
      profile: profile(career),
      existingSkills: skillList(career),
      experience: experience(career)
    });
    if (!raw) return null;
    const json = extractJson(raw);
    return Array.isArray(json) ? json : null;
  }

  async function suggestSkills(career) {
    const raw = await request({
      task: 'suggest_skills',
      locale: locale(career),
      profile: profile(career),
      existingSkills: skillList(career)
    });
    if (!raw) return null;
    const json = extractJson(raw);
    if (Array.isArray(json)) return json.map(String).filter(Boolean).slice(0, 10);
    return String(raw).split(/\r?\n|,/).map(item => item.replace(/^[-*\d.\s]+/, '').trim()).filter(Boolean).slice(0, 10);
  }

  function extractJson(text) {
    try { return JSON.parse(text); } catch { /* continue */ }
    const match = String(text || '').match(/\[[\s\S]*\]/);
    if (!match) return null;
    try { return JSON.parse(match[0]); } catch { return null; }
  }

  return { configured, generateSummary, improveText, improveBullets, suggestSkills };
})();
