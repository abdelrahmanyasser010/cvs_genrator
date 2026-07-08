/**
 * Shared browser-side safety helpers for static rendering.
 */
const Safety = (function () {
  const HTML_ENTITIES = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };

  const ALLOWED_URL_PROTOCOLS = new Set(['http:', 'https:', 'mailto:', 'tel:']);

  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value).replace(/[&<>"']/g, char => HTML_ENTITIES[char]);
  }

  function escapeAttr(value) {
    return escapeHtml(value);
  }

  function safeUrl(value) {
    const raw = String(value || '').trim();
    if (!raw) return '';
    try {
      const url = new URL(raw, window.location.origin);
      return ALLOWED_URL_PROTOCOLS.has(url.protocol) ? raw : '';
    } catch {
      return '';
    }
  }

  function toJsonScriptValue(value) {
    return JSON.stringify(String(value || ''));
  }

  return { escapeHtml, escapeAttr, safeUrl, toJsonScriptValue };
})();

if (typeof module !== 'undefined') module.exports = Safety;
