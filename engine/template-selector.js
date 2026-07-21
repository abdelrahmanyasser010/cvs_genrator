/**
 * Template selection — single template = layout + theme + typography bundled
 */
const TemplateSelector = (function () {
  // Five curated release templates. Legacy layouts remain supported for old saved CVs,
  // but they are intentionally hidden from the main gallery until they pass the same QA bar.
  const TEMPLATES = [
    { id: 'ai-recommended', nameKey: 'templates.recommended', featured: false, layoutId: 'classic', themeId: 'ats' },
    { id: 'ats', nameKey: 'templates.ats', featured: true, layoutId: 'classic', themeId: 'ats' },
    { id: 'classic', nameKey: 'templates.classic', featured: true, layoutId: 'classic', themeId: 'classic' },
    { id: 'modern', nameKey: 'templates.modern', featured: true, layoutId: 'sidebar', themeId: 'modern' },
    { id: 'corporate', nameKey: 'templates.corporate', featured: true, layoutId: 'corporate', themeId: 'corporate' },
    { id: 'executive', nameKey: 'templates.executive', featured: true, layoutId: 'corporate', themeId: 'executive' },
    { id: 'sidebar', nameKey: 'templates.sidebar', featured: false, layoutId: 'sidebar', themeId: 'minimal' },
    { id: 'timeline', nameKey: 'templates.timeline', featured: false, layoutId: 'timeline', themeId: 'modern' },
    { id: 'compact', nameKey: 'templates.compact', featured: false, layoutId: 'classic', themeId: 'compact' },
    { id: 'academic', nameKey: 'templates.academic', featured: false, layoutId: 'classic', themeId: 'minimal' },
    { id: 'elegant', nameKey: 'templates.elegant', featured: false, layoutId: 'classic', themeId: 'elegant' },
    { id: 'creative', nameKey: 'templates.creative', featured: false, layoutId: 'canva_sidebar', themeId: 'creative' },
    { id: 'vibrant', nameKey: 'templates.vibrant', featured: false, layoutId: 'canva_header', themeId: 'vibrant' },
    { id: 'canva-teal', nameKey: 'templates.canvaTeal', featured: false, layoutId: 'canva_sidebar', themeId: 'canva-teal' },
    { id: 'canva-navy', nameKey: 'templates.canvaNavy', featured: false, layoutId: 'canva_header', themeId: 'canva-navy' },
    { id: 'canva-soft', nameKey: 'templates.canvaSoft', featured: false, layoutId: 'canva_sidebar', themeId: 'canva-soft' }
  ];

  const LEVEL_TEMPLATE_DEFAULTS = { fresh: 'ats', junior: 'ats', mid: 'corporate', senior: 'executive' };
  const FIELD_TEMPLATE_DEFAULTS = { developer: 'ats', doctor: 'ats', teacher: 'classic', accountant: 'ats', other: 'ats' };

  function getTemplates() { return TEMPLATES; }
  function getFeaturedTemplates() { return TEMPLATES.filter(t => t.featured); }

  function resolveRecommendedTemplate(career, profileMeta) {
    const level = career.careerProfile?.level || 'mid';
    const field = career.careerProfile?.field || 'other';
    if (profileMeta?.recommendedTemplate?.[level]) return profileMeta.recommendedTemplate[level];
    return LEVEL_TEMPLATE_DEFAULTS[level] || FIELD_TEMPLATE_DEFAULTS[field] || 'classic';
  }

  function resolveRecommended(career, profileMeta) {
    return resolveRecommendedTemplate(career, profileMeta);
  }

  function getEffectiveTemplateId(career) {
    const id = career.meta?.templateId || 'ai-recommended';
    if (id === 'ai-recommended') return career.meta?._resolvedTemplate || 'classic';
    const template = TEMPLATES.find(t => t.id === id);
    return template ? id : 'classic';
  }

  function getEffectiveLayoutId(career) {
    const templateId = getEffectiveTemplateId(career);
    const template = TEMPLATES.find(t => t.id === templateId);
    return template?.layoutId || 'classic';
  }

  function getEffectiveThemeId(career) {
    const templateId = getEffectiveTemplateId(career);
    const template = TEMPLATES.find(t => t.id === templateId);
    return template?.themeId || 'ats';
  }

  function getLayoutCssPath() {
    return '/templates/layouts/layouts.css';
  }

  function getThemeCssPath(themeId) {
    return `/templates/${themeId}/style.css`;
  }

  function templateName(templateId, tFn) {
    const t = tFn || (k => k);
    if (templateId === 'ai-recommended') return t('templates.recommended', 'Recommended');
    const template = TEMPLATES.find(tmpl => tmpl.id === templateId);
    return template ? t(template.nameKey, templateId) : templateId;
  }

  return {
    TEMPLATES,
    getTemplates, getFeaturedTemplates,
    resolveRecommended, resolveRecommendedTemplate,
    getEffectiveTemplateId, getEffectiveLayoutId, getEffectiveThemeId,
    getLayoutCssPath, getThemeCssPath,
    templateName
  };
})();

if (typeof module !== 'undefined') module.exports = TemplateSelector;
