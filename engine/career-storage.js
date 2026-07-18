/**
 * career.json persistence — localStorage + import/export
 */
const CareerStorage = (function () {
  const STORAGE_KEY = 'cv_studio_career';
  const REGISTRY_KEY = 'cv_studio_versions_registry';
  const ACTIVE_VER_KEY = 'cv_studio_active_version_id';

  function getActiveVersionId() {
    return localStorage.getItem(ACTIVE_VER_KEY) || 'default';
  }

  function listVersions() {
    try {
      const raw = localStorage.getItem(REGISTRY_KEY);
      let registry = raw ? JSON.parse(raw) : [];
      if (!Array.isArray(registry)) registry = [];
      const current = load();
      const defaultName = current?.meta?.versionName || current?.personalInfo?.title || current?.personalInfo?.name || 'السيرة الرئيسية (Default)';
      if (!registry.some(v => v.id === 'default')) {
        registry.unshift({
          id: 'default',
          name: defaultName,
          updatedAt: current?.meta?.updatedAt || new Date().toISOString(),
          level: current?.careerProfile?.level || 'junior',
          field: current?.careerProfile?.field || 'developer'
        });
      }
      return registry;
    } catch {
      return [{ id: 'default', name: 'السيرة الرئيسية', updatedAt: new Date().toISOString() }];
    }
  }

  function saveVersionToRegistry(id, careerObj) {
    try {
      const registry = listVersions();
      const idx = registry.findIndex(v => v.id === id);
      const entry = {
        id: id,
        name: careerObj?.meta?.versionName || careerObj?.personalInfo?.title || careerObj?.personalInfo?.name || (id === 'default' ? 'السيرة الرئيسية' : 'نسخة مخصصة'),
        updatedAt: careerObj?.meta?.updatedAt || new Date().toISOString(),
        level: careerObj?.careerProfile?.level || 'junior',
        field: careerObj?.careerProfile?.field || 'developer'
      };
      if (idx >= 0) {
        registry[idx] = entry;
      } else {
        registry.push(entry);
      }
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
    } catch(e) {}
  }

  function save(career) {
    career.meta = career.meta || {};
    career.meta.updatedAt = new Date().toISOString();
    const activeId = getActiveVersionId();
    if (activeId !== 'default') {
      career.meta.versionId = activeId;
      localStorage.setItem(activeId, JSON.stringify(career));
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(career));
    saveVersionToRegistry(activeId, career);
    return career;
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return typeof CareerNormalize !== 'undefined' ? CareerNormalize.normalize(JSON.parse(raw)) : JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function duplicateCareer(newName, targetJD) {
    const current = load() || {};
    const newId = 'cv_' + Date.now().toString(36);
    const clone = JSON.parse(JSON.stringify(current));
    clone.meta = clone.meta || {};
    clone.meta.versionId = newId;
    clone.meta.versionName = newName || ((clone.personalInfo?.title || 'السيرة الذاتية') + ' - تخصيص وظيفي');
    if (targetJD) clone.meta.targetJD = targetJD;
    clone.meta.updatedAt = new Date().toISOString();

    localStorage.setItem(newId, JSON.stringify(clone));
    localStorage.setItem(ACTIVE_VER_KEY, newId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(clone));
    saveVersionToRegistry(newId, clone);
    return { id: newId, career: clone, versions: listVersions() };
  }

  function switchVersion(versionId) {
    try {
      const current = load();
      const currentId = getActiveVersionId();
      if (current && currentId !== 'default') {
        localStorage.setItem(currentId, JSON.stringify(current));
      }
      let targetRaw = null;
      if (versionId === 'default') {
        targetRaw = localStorage.getItem('default') || localStorage.getItem(STORAGE_KEY);
      } else {
        targetRaw = localStorage.getItem(versionId);
      }
      if (!targetRaw) return current;
      const parsed = typeof CareerNormalize !== 'undefined' ? CareerNormalize.normalize(JSON.parse(targetRaw)) : JSON.parse(targetRaw);
      localStorage.setItem(ACTIVE_VER_KEY, versionId);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
      return parsed;
    } catch(e) {
      return load();
    }
  }

  function deleteVersion(versionId) {
    if (versionId === 'default') return false;
    try {
      localStorage.removeItem(versionId);
      let registry = listVersions().filter(v => v.id !== versionId);
      localStorage.setItem(REGISTRY_KEY, JSON.stringify(registry));
      if (getActiveVersionId() === versionId) {
        switchVersion('default');
      }
      return true;
    } catch(e) {
      return false;
    }
  }

  function clear() {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_VER_KEY);
  }

  function exportJson(career) {
    return JSON.stringify(career, null, 2);
  }

  function importJson(jsonString) {
    const parsed = JSON.parse(jsonString);
    const normalized = typeof CareerNormalize !== 'undefined' ? CareerNormalize.normalize(parsed) : parsed;
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
    const normalized = typeof CareerNormalize !== 'undefined' ? CareerNormalize.normalize(data) : data;
    save(normalized);
    return normalized;
  }

  return { 
    save, load, clear, exportJson, importJson, download, loadSample, 
    listVersions, getActiveVersionId, duplicateCareer, switchVersion, deleteVersion,
    STORAGE_KEY 
  };
})();

if (typeof module !== 'undefined') module.exports = CareerStorage;
