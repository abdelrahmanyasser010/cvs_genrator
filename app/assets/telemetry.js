/** Privacy-minimized client error reporting. Never includes CV content. */
(function () {
  const BUILD = '20260720-prod1';
  let sent = 0;
  function redact(value) {
    return String(value || '')
      .replace(/[\w.+-]+@[\w.-]+\.[a-z]{2,}/gi, '[email]')
      .replace(/\+?\d[\d\s().-]{7,}\d/g, '[phone]')
      .slice(0, 1800);
  }
  function report(type, message, stack) {
    if (sent >= 5 || !navigator.onLine) return;
    sent += 1;
    const body = JSON.stringify({
      type: redact(type).slice(0, 30),
      message: redact(message).slice(0, 500),
      stack: redact(stack),
      path: location.pathname,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      build: BUILD
    });
    fetch('/api/telemetry/client-error', {
      method: 'POST',
      credentials: 'same-origin',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {});
  }
  window.addEventListener('error', event => report('error', event.message, event.error?.stack));
  window.addEventListener('unhandledrejection', event => report('unhandledrejection', event.reason?.message || event.reason, event.reason?.stack));
})();
