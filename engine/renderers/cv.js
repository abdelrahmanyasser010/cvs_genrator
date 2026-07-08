/**
 * CV renderer — delegates to LayoutEngine via TemplateSelector
 */
const CVRenderer = (function () {
  function resolveTemplateId(career, options) {
    return options?.templateId || TemplateSelector.getEffectiveTemplateId(career);
  }

  function renderBody(career, options) {
    const templateId = resolveTemplateId(career, options);
    const template = TemplateSelector.getTemplates().find(t => t.id === templateId);
    const layoutId = template?.layoutId || 'classic';
    return LayoutEngine.render(career, layoutId);
  }

  function renderInner(career, options) {
    const full = renderBody(career, options);
    return full.replace(/^<div class="cv-paper[^"]*">/, '').replace(/<\/div>\s*$/, '');
  }

  function renderToElement(career, rootEl, options) {
    const html = renderBody(career, options);
    if (rootEl) rootEl.innerHTML = html;
    return html;
  }

  function render(career, templateOrRootEl, maybeRootEl) {
    if (typeof templateOrRootEl === 'string') {
      return renderToElement(career, maybeRootEl, { templateId: templateOrRootEl });
    }
    return renderToElement(career, templateOrRootEl, maybeRootEl);
  }

  return { renderBody, renderInner, renderToElement, render, esc: CVSections.esc };
})();

if (typeof module !== 'undefined') module.exports = CVRenderer;
