/**
 * Template selection — single template = layout + theme + typography bundled
 */
const TemplateSelector = (function () {
  const TEMPLATES = [
    { id: 'ai-recommended', nameKey: 'templates.ai-recommended', featured: true, layoutId: 'classic', themeId: 'ats' },
    { id: 'ats', nameKey: 'templates.ats', featured: true, layoutId: 'classic', themeId: 'ats' },
    { id: 'classic', nameKey: 'templates.classic', featured: true, layoutId: 'classic', themeId: 'minimal' },
    { id: 'modern', nameKey: 'templates.modern', featured: true, layoutId: 'sidebar', themeId: 'modern' },
    { id: 'sidebar', nameKey: 'templates.sidebar', featured: true, layoutId: 'sidebar', themeId: 'minimal' },
    { id: 'timeline', nameKey: 'templates.timeline', featured: true, layoutId: 'timeline', themeId: 'modern' },
    { id: 'compact', nameKey: 'templates.compact', featured: true, layoutId: 'classic', themeId: 'compact' },
    { id: 'academic', nameKey: 'templates.academic', featured: true, layoutId: 'classic', themeId: 'minimal' },
    { id: 'corporate', nameKey: 'templates.corporate', featured: true, layoutId: 'corporate', themeId: 'executive' },
    { id: 'executive', nameKey: 'templates.executive', featured: true, layoutId: 'corporate', themeId: 'executive' },
    { id: 'elegant', nameKey: 'templates.elegant', featured: true, layoutId: 'classic', themeId: 'elegant' },
    { id: 'creative', nameKey: 'templates.creative', featured: true, layoutId: 'sidebar', themeId: 'creative' },
    { id: 'vibrant', nameKey: 'templates.vibrant', featured: true, layoutId: 'sidebar', themeId: 'vibrant' },
    { id: 'canva-teal', nameKey: 'templates.canvaTeal', featured: true, layoutId: 'sidebar', themeId: 'canva-teal' },
    { id: 'canva-navy', nameKey: 'templates.canvaNavy', featured: true, layoutId: 'sidebar', themeId: 'canva-navy' },
    { id: 'canva-soft', nameKey: 'templates.canvaSoft', featured: true, layoutId: 'corporate', themeId: 'canva-soft' }
  ];

  const LEVEL_TEMPLATE_DEFAULTS = { fresh: 'classic', junior: 'ats', mid: 'ats', senior: 'corporate' };
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
    if (templateId === 'ai-recommended') return t('templates.ai-recommended', 'AI Recommended');
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
