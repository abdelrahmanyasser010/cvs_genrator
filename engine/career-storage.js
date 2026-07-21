/**
 * CV Studio local-first persistence.
 * Each resume version is stored independently with a recovery mirror and exportable backup bundle.
 */
const CareerStorage = (function () {
  const STORAGE_KEY = 'cv_studio_career';
  const REGISTRY_KEY = 'cv_studio_versions_registry';
  const ACTIVE_VER_KEY = 'cv_studio_active_version_id';
  const VERSION_PREFIX = 'cv_studio_version_';
  const RECOVERY_KEY = 'cv_studio_recovery_snapshot_v1';
  const LAST_BACKUP_KEY = 'cv_studio_last_backup_at';
  const DEFAULT_ID = 'default';

  const versionKey = id => VERSION_PREFIX + (id || DEFAULT_ID);

  function normalize(value) {
    return typeof CareerNormalize !== 'undefined' ? CareerNormalize.normalize(value) : value;
  }

  function parse(raw) {
    if (!raw) return null;
    try { return normalize(JSON.parse(raw)); } catch { return null; }
  }

  function safeSet(key, value) {
    try {
      localStorage.setItem(key, value);
      return true;
    } catch (error) {
      const wrapped = new Error('تعذر حفظ بيانات السيرة على هذا الجهاز. نزّل نسخة احتياطية وأفرغ بعض مساحة المتصفح.');
      wrapped.code = error?.name === 'QuotaExceededError' ? 'STORAGE_QUOTA' : 'STORAGE_FAILED';
      wrapped.cause = error;
      throw wrapped;
    }
  }

  function getActiveVersionId() {
    return localStorage.getItem(ACTIVE_VER_KEY) || DEFAULT_ID;
  }

  function readRecovery(versionId) {
    try {
      const envelope = JSON.parse(localStorage.getItem(RECOVERY_KEY) || 'null');
      if (!envelope || envelope.versionId !== versionId || !envelope.career) return null;
      return normalize(envelope.career);
    } catch { return null; }
  }

  function writeRecovery(id, career) {
    safeSet(RECOVERY_KEY, JSON.stringify({
      versionId: id,
      savedAt: new Date().toISOString(),
      career
    }));
  }

  function readVersion(id) {
    let raw = localStorage.getItem(versionKey(id));
    if (!raw && id === DEFAULT_ID) raw = localStorage.getItem(STORAGE_KEY);
    return parse(raw) || readRecovery(id);
  }

  function writeVersion(id, career) {
    const serialized = JSON.stringify(career);
    safeSet(versionKey(id), serialized);
    writeRecovery(id, career);
    if (id === getActiveVersionId()) safeSet(STORAGE_KEY, serialized);
  }

  function rawRegistry() {
    try {
      const value = JSON.parse(localStorage.getItem(REGISTRY_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch { return []; }
  }

  function makeEntry(id, career) {
    return {
      id,
      name: career?.meta?.versionName || career?.personalInfo?.title || career?.personalInfo?.name || (id === DEFAULT_ID ? 'السيرة الرئيسية' : 'نسخة مخصصة'),
      updatedAt: career?.meta?.updatedAt || new Date().toISOString(),
      level: career?.careerProfile?.level || 'junior',
      field: career?.careerProfile?.field || 'other'
    };
  }

  function saveVersionToRegistry(id, career) {
    const registry = rawRegistry();
    const entry = makeEntry(id, career);
    const idx = registry.findIndex(item => item.id === id);
    if (idx >= 0) registry[idx] = entry; else registry.push(entry);
    registry.sort((a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0));
    safeSet(REGISTRY_KEY, JSON.stringify(registry));
  }

  function listVersions() {
    const registry = rawRegistry().filter(item => !!readVersion(item.id));
    const defaultCareer = readVersion(DEFAULT_ID);
    if (defaultCareer && !registry.some(item => item.id === DEFAULT_ID)) registry.unshift(makeEntry(DEFAULT_ID, defaultCareer));
    safeSet(REGISTRY_KEY, JSON.stringify(registry));
    return registry;
  }

  function save(career) {
    const normalized = normalize(career || {});
    normalized.meta = normalized.meta || {};
    normalized.meta.updatedAt = new Date().toISOString();
    const activeId = getActiveVersionId();
    normalized.meta.versionId = activeId;
    if (activeId === DEFAULT_ID && !normalized.meta.versionName) normalized.meta.versionName = 'السيرة الرئيسية';
    writeVersion(activeId, normalized);
    safeSet(STORAGE_KEY, JSON.stringify(normalized));
    safeSet(ACTIVE_VER_KEY, activeId);
    saveVersionToRegistry(activeId, normalized);
    return normalized;
  }

  function load() {
    const activeId = getActiveVersionId();
    const career = readVersion(activeId) || readVersion(DEFAULT_ID) || parse(localStorage.getItem(STORAGE_KEY));
    if (!career) return null;
    writeVersion(activeId, career);
    saveVersionToRegistry(activeId, career);
    return career;
  }

  function createNew(career, name) {
    const obj = normalize(career || (typeof CareerNormalize !== 'undefined' ? CareerNormalize.createEmpty() : {}));
    obj.meta = obj.meta || {};
    obj.meta.versionId = DEFAULT_ID;
    obj.meta.versionName = name || 'السيرة الرئيسية';
    safeSet(ACTIVE_VER_KEY, DEFAULT_ID);
    writeVersion(DEFAULT_ID, obj);
    safeSet(STORAGE_KEY, JSON.stringify(obj));
    saveVersionToRegistry(DEFAULT_ID, obj);
    return obj;
  }

  function createBlankVersion(name, seed) {
    const hasDefault = !!readVersion(DEFAULT_ID);
    const id = hasDefault ? ('cv_' + Date.now().toString(36)) : DEFAULT_ID;
    const blank = normalize(seed || (typeof CareerNormalize !== 'undefined' ? CareerNormalize.createEmpty() : {}));
    blank.meta = blank.meta || {};
    blank.meta.versionId = id;
    blank.meta.versionName = name || (id === DEFAULT_ID ? 'السيرة الرئيسية' : 'سيرة جديدة');
    blank.meta.createdAt = new Date().toISOString();
    blank.meta.updatedAt = blank.meta.createdAt;
    safeSet(ACTIVE_VER_KEY, id);
    writeVersion(id, blank);
    safeSet(STORAGE_KEY, JSON.stringify(blank));
    saveVersionToRegistry(id, blank);
    return { id, career: blank, versions: listVersions() };
  }

  function duplicateCareer(newName, targetJD) {
    const current = load() || {};
    const newId = 'cv_' + Date.now().toString(36);
    const clone = normalize(JSON.parse(JSON.stringify(current)));
    clone.meta = clone.meta || {};
    clone.meta.versionId = newId;
    clone.meta.versionName = newName || ((clone.personalInfo?.title || clone.personalInfo?.name || 'السيرة الذاتية') + ' - نسخة مخصصة');
    if (targetJD) clone.meta.targetJD = targetJD;
    else {
      delete clone.meta.targetJD;
      delete clone.meta.jdMatchScore;
      delete clone.meta.jdFoundKeywords;
      delete clone.meta.jdMissingKeywords;
    }
    clone.meta.updatedAt = new Date().toISOString();
    safeSet(ACTIVE_VER_KEY, newId);
    writeVersion(newId, clone);
    safeSet(STORAGE_KEY, JSON.stringify(clone));
    saveVersionToRegistry(newId, clone);
    return { id: newId, career: clone, versions: listVersions() };
  }

  function switchVersion(versionId) {
    const target = readVersion(versionId);
    if (!target) return load();
    safeSet(ACTIVE_VER_KEY, versionId);
    safeSet(STORAGE_KEY, JSON.stringify(target));
    writeRecovery(versionId, target);
    return target;
  }

  function deleteVersion(versionId) {
    if (!versionId || versionId === DEFAULT_ID) return false;
    localStorage.removeItem(versionKey(versionId));
    localStorage.removeItem(versionId);
    const registry = rawRegistry().filter(item => item.id !== versionId);
    safeSet(REGISTRY_KEY, JSON.stringify(registry));
    if (getActiveVersionId() === versionId) switchVersion(DEFAULT_ID);
    return true;
  }

  function clear(options = {}) {
    const all = options === true || options.allVersions === true;
    if (all) {
      listVersions().forEach(item => localStorage.removeItem(versionKey(item.id)));
      localStorage.removeItem(REGISTRY_KEY);
      localStorage.removeItem(RECOVERY_KEY);
    }
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(ACTIVE_VER_KEY);
  }

  function exportJson(career) { return JSON.stringify(career, null, 2); }

  function createBackupBundle() {
    const versions = {};
    listVersions().forEach(entry => {
      const data = readVersion(entry.id);
      if (data) versions[entry.id] = data;
    });
    return {
      format: 'cv-studio-backup',
      version: 1,
      exportedAt: new Date().toISOString(),
      activeVersionId: getActiveVersionId(),
      versions
    };
  }

  function importJson(jsonString) {
    const parsed = JSON.parse(jsonString);
    if (parsed?.format === 'cv-studio-backup' && parsed?.versions && typeof parsed.versions === 'object') {
      const ids = Object.keys(parsed.versions);
      if (!ids.length) throw new Error('Empty backup.');
      ids.forEach(id => {
        const data = normalize(parsed.versions[id]);
        data.meta = data.meta || {};
        data.meta.versionId = id;
        writeVersion(id, data);
        saveVersionToRegistry(id, data);
      });
      const active = parsed.activeVersionId && parsed.versions[parsed.activeVersionId] ? parsed.activeVersionId : ids[0];
      return switchVersion(active);
    }
    const normalized = normalize(parsed);
    return createBlankVersion(normalized?.meta?.versionName || 'سيرة مستوردة', normalized).career;
  }

  function triggerDownload(content, filename) {
    if (typeof document === 'undefined') return false;
    const blob = new Blob([content], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 500);
    return true;
  }

  function download(career, filename) {
    const ok = triggerDownload(exportJson(career), filename || 'cv.json');
    if (ok) safeSet(LAST_BACKUP_KEY, new Date().toISOString());
    return ok;
  }

  function downloadBackup(filename) {
    const date = new Date().toISOString().slice(0, 10);
    const ok = triggerDownload(JSON.stringify(createBackupBundle(), null, 2), filename || `cv-studio-backup-${date}.json`);
    if (ok) safeSet(LAST_BACKUP_KEY, new Date().toISOString());
    return ok;
  }

  function getSafetyStatus() {
    const lastBackupAt = localStorage.getItem(LAST_BACKUP_KEY) || '';
    const ageMs = lastBackupAt ? Date.now() - new Date(lastBackupAt).getTime() : Infinity;
    return {
      localOnly: true,
      lastBackupAt,
      needsBackup: !lastBackupAt || ageMs > 7 * 24 * 60 * 60 * 1000,
      recoveryAvailable: !!localStorage.getItem(RECOVERY_KEY),
      versionCount: listVersions().length
    };
  }

  async function loadSample(path) {
    const response = await fetch(path);
    return createNew(await response.json(), 'سيرة تجريبية');
  }

  return {
    save, load, clear, createNew, createBlankVersion, exportJson, importJson, download, downloadBackup, loadSample,
    listVersions, getActiveVersionId, duplicateCareer, switchVersion, deleteVersion,
    createBackupBundle, getSafetyStatus,
    STORAGE_KEY, REGISTRY_KEY, ACTIVE_VER_KEY, RECOVERY_KEY, LAST_BACKUP_KEY
  };
})();

if (typeof module !== 'undefined') module.exports = CareerStorage;
