/**
 * career.json persistence — localStorage + import/export
 */
const CareerStorage = (function () {
  const STORAGE_KEY = 'cv_studio_career';

  function save(career) {
    career.meta = career.meta || {};
    career.meta.updatedAt = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(career));
    return career;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return CareerNormalize.normalize(JSON.parse(raw));
    } catch {
      return null;
    }
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
  }

  function exportJson(career) {
    return JSON.stringify(career, null, 2);
  }

  function importJson(jsonString) {
    const parsed = JSON.parse(jsonString);
    const normalized = CareerNormalize.normalize(parsed);
    save(normalized);
    return normalized;
  }

  function download(career, filename) {
    const blob = new Blob([exportJson(career)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename || 'cv.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  async function loadSample(path) {
    const res = await fetch(path);
    const data = await res.json();
    const normalized = CareerNormalize.normalize(data);
    save(normalized);
    return normalized;
  }

  return { save, load, clear, exportJson, importJson, download, loadSample, STORAGE_KEY };
})();

if (typeof module !== 'undefined') module.exports = CareerStorage;
