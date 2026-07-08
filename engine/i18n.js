/**
 * UI i18n — loads JSON strings, applies RTL/LTR
 */
const I18n = (function () {
  let locale = 'en';
  let strings = {};

  async function init(preferred) {
    locale = preferred || localStorage.getItem('cv_studio_locale') || 'en';
    try {
      const res = await fetch(`/app/assets/i18n/${locale}.json`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      strings = await res.json();
    } catch (e) {
      console.warn('Failed to load i18n JSON, using fallback:', e);
      // Fallback strings for common keys
      strings = {
        appName: 'CV Studio',
        wizard: 'Wizard',
        letsStart: "Let's start",
        back: 'Back',
        continue: 'Continue',
        skip: 'Skip for now',
        finish: 'Finish',
        language: { title: 'Choose your language', subtitle: 'You can change this later.', en: 'English', ar: 'Arabic' },
        welcome: { title: 'Welcome to CV Studio', subtitle: "We'll build your resume step by step." },
        field: { title: 'What do you do?', subtitle: 'Pick your field.' },
        level: { title: "What's your experience level?", subtitle: "We'll pick the best layout for you." }
      };
    }
    applyDocument();
    return locale;
  }

  function applyDocument() {
    document.documentElement.lang = locale;
    document.documentElement.dir = locale === 'ar' ? 'rtl' : 'ltr';
    document.body.classList.toggle('rtl', locale === 'ar');
    const fontLink = document.getElementById('locale-font');
    if (fontLink) {
      fontLink.href = locale === 'ar'
        ? 'https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap'
        : 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
    }
    document.body.style.fontFamily = locale === 'ar'
      ? "'Cairo', 'Segoe UI', Arial, sans-serif"
      : "'Inter', 'Segoe UI', Arial, sans-serif";
    
    translateDom();
  }

  function translateDom() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const translation = t(key);
      if (translation && translation !== key) {
        if (el.tagName === 'INPUT' && el.type === 'button') {
            el.value = translation;
        } else {
            el.textContent = translation;
        }
      }
    });
  }

  function setLocale(loc) {
    locale = loc;
    localStorage.setItem('cv_studio_locale', loc);
    return init(loc);
  }

  function getLocale() { return locale; }

  function t(key, fallback) {
    const parts = key.split('.');
    let v = strings;
    for (const p of parts) {
      v = v?.[p];
      if (v === undefined) return fallback || key;
    }
    return v;
  }

  function getCvLabels() {
    return {
      summary: t('cv.summary'),
      experience: t('cv.experience'),
      projects: t('cv.projects'),
      skills: t('cv.skills'),
      education: t('cv.education'),
      languages: t('cv.languages')
    };
  }

  return { init, setLocale, getLocale, t, getCvLabels, applyDocument, translateDom };
})();

if (typeof module !== 'undefined') module.exports = I18n;

