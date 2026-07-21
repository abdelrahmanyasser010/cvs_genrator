/**
 * Production AI privacy settings.
 * API keys are never collected in the browser.
 */
const AISettings = (function () {
  const CONSENT_KEY = 'cv_studio_ai_consent_v2';
  const PREVIEW_KEY = 'cv_studio_ai_preview';
  const el = id => document.getElementById(id);
  const t = (key, fb) => (typeof I18n !== 'undefined' ? I18n.t(key, fb) : fb || key);
  const isAr = () => (document.documentElement.lang || 'en') === 'ar';

  function consented() {
    return localStorage.getItem(CONSENT_KEY) === 'accepted';
  }

  function shouldShowPreview() {
    return localStorage.getItem(PREVIEW_KEY) === 'true';
  }

  function setPromptPreview(value) {
    localStorage.setItem(PREVIEW_KEY, String(!!value));
  }

  function revokeConsent() {
    localStorage.removeItem(CONSENT_KEY);
  }

  function ensureConsent() {
    if (consented()) return Promise.resolve(true);
    return new Promise(resolve => {
      const existing = el('ai-consent-modal');
      if (existing) existing.remove();
      const modal = document.createElement('div');
      modal.id = 'ai-consent-modal';
      modal.className = 'modal-overlay ai-consent-overlay';
      modal.style.display = 'flex';
      modal.innerHTML = `
        <div class="modal-box ai-consent-box" role="dialog" aria-modal="true" aria-labelledby="ai-consent-title">
          <div class="modal-header">
            <h3 id="ai-consent-title">${isAr() ? 'خصوصية المساعد الذكي' : 'AI assistant privacy'}</h3>
          </div>
          <div class="ai-consent-copy">
            <p>${isAr()
              ? 'عند استخدام التحسين بالذكاء الاصطناعي، نرسل فقط النص المطلوب تحسينه وسياقًا مهنيًا محدودًا مثل المجال والمستوى والمهارات.'
              : 'When you use AI improvements, we send only the text being improved and limited professional context such as field, level, and skills.'}</p>
            <ul>
              <li>${isAr() ? 'لا نرسل الاسم أو البريد أو الهاتف أو العنوان أو الروابط.' : 'We do not send your name, email, phone, address, or links.'}</li>
              <li>${isAr() ? 'لا نطلب منك مفتاح API ولا نخزنه في المتصفح.' : 'We never ask for or store your API key in the browser.'}</li>
              <li>${isAr() ? 'راجع أي اقتراح قبل اعتماده؛ الذكاء الاصطناعي قد يخطئ.' : 'Review every suggestion before applying it; AI can make mistakes.'}</li>
            </ul>
            <label class="ai-consent-preview"><input type="checkbox" id="ai-consent-preview-check"> ${isAr() ? 'أظهر البيانات المرسلة قبل كل طلب' : 'Show the data sent before every request'}</label>
            <a href="/app/privacy.html" target="_blank" rel="noopener">${isAr() ? 'اقرأ سياسة الخصوصية المختصرة' : 'Read the short privacy notice'}</a>
          </div>
          <div class="wizard-actions ai-consent-actions">
            <button class="btn btn-ghost" data-action="decline">${isAr() ? 'ليس الآن' : 'Not now'}</button>
            <button class="btn btn-primary" data-action="accept">${isAr() ? 'موافق واستخدم المساعد' : 'Agree and use AI'}</button>
          </div>
        </div>`;
      document.body.appendChild(modal);
      const finish = value => { modal.remove(); resolve(value); };
      modal.addEventListener('click', event => {
        if (event.target === modal || event.target?.dataset?.action === 'decline') finish(false);
        if (event.target?.dataset?.action === 'accept') {
          localStorage.setItem(CONSENT_KEY, 'accepted');
          setPromptPreview(!!el('ai-consent-preview-check')?.checked);
          finish(true);
        }
      });
    });
  }

  function openModal() {
    const existing = el('ai-settings-modal');
    if (existing) existing.remove();
    const modal = document.createElement('div');
    modal.id = 'ai-settings-modal';
    modal.className = 'modal-overlay';
    modal.style.display = 'flex';
    modal.innerHTML = `
      <div class="modal-box ai-settings-production" role="dialog" aria-modal="true">
        <div class="modal-header">
          <h3>${isAr() ? 'إعدادات الخصوصية والذكاء الاصطناعي' : 'AI & privacy settings'}</h3>
          <button class="modal-close" data-action="close">✕</button>
        </div>
        <div class="ai-managed-status">
          <strong>${isAr() ? 'مفتاح الذكاء الاصطناعي محمي على الخادم' : 'AI key is protected on the server'}</strong>
          <span>${isAr() ? 'لن يطلب منك CV Studio وضع مفتاح API داخل المتصفح.' : 'CV Studio never asks you to place an API key in the browser.'}</span>
        </div>
        <label class="ai-consent-preview"><input type="checkbox" id="ai-prompt-preview" ${shouldShowPreview() ? 'checked' : ''}> ${isAr() ? 'أظهر البيانات المرسلة قبل كل طلب' : 'Show the data sent before each request'}</label>
        <div class="ai-settings-links">
          <a href="/app/privacy.html" target="_blank" rel="noopener">${isAr() ? 'سياسة الخصوصية المختصرة' : 'Short privacy notice'}</a>
          <button type="button" class="btn btn-ghost" data-action="revoke">${isAr() ? 'إلغاء موافقة الذكاء الاصطناعي' : 'Revoke AI consent'}</button>
        </div>
        <div class="wizard-actions" style="justify-content:flex-end">
          <button class="btn btn-primary" data-action="save">${isAr() ? 'حفظ' : 'Save'}</button>
        </div>
      </div>`;
    document.body.appendChild(modal);
    modal.addEventListener('click', event => {
      const action = event.target?.dataset?.action;
      if (event.target === modal || action === 'close') modal.remove();
      if (action === 'revoke') {
        revokeConsent();
        modal.remove();
      }
      if (action === 'save') {
        setPromptPreview(!!el('ai-prompt-preview')?.checked);
        modal.remove();
      }
    });
  }

  return {
    openModal,
    ensureConsent,
    consented,
    revokeConsent,
    shouldShowPreview,
    setPromptPreview
  };
})();
