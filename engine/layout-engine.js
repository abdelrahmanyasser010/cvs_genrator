/**
 * Layout engine — 6 structural architectures
 * Note: This is now called by TemplateSelector which bundles layout + theme
 */
const LayoutEngine = (function () {
  function labels(career) {
    if (typeof I18n !== 'undefined' && I18n.getCvLabels) return I18n.getCvLabels();
    return { summary: 'Professional Summary', experience: 'Experience', projects: 'Projects', skills: 'Skills', education: 'Education', languages: 'Languages' };
  }

  function classic(career) {
    const L = labels(career);
    return CVSections.header(career) + CVSections.summary(career, L) + CVSections.experience(career, L) +
      CVSections.projects(career, L) + CVSections.skills(career, L) + CVSections.education(career, L) + CVSections.languages(career, L);
  }

  function sidebar(career) {
    const L = labels(career);
    const side = CVSections.skills(career, L) + CVSections.education(career, L) + CVSections.languages(career, L);
    const main = CVSections.summary(career, L) + CVSections.experience(career, L) + CVSections.projects(career, L);
    return CVSections.header(career) + `<div class="layout-sidebar-wrap"><aside class="cv-sidebar">${side}</aside><main class="cv-main">${main}</main></div>`;
  }

  function twocol(career) {
    const L = labels(career);
    const left = CVSections.skills(career, L) + CVSections.education(career, L);
    const right = CVSections.summary(career, L) + CVSections.experience(career, L) + CVSections.projects(career, L);
    return CVSections.header(career) + `<div class="layout-twocol"><div class="col-left">${left}</div><div class="col-right">${right}</div></div>` + CVSections.languages(career, L);
  }

  function timeline(career) {
    const L = labels(career);
    return CVSections.header(career) + CVSections.summary(career, L) + CVSections.experienceTimeline(career, L) +
      CVSections.projects(career, L) + CVSections.skills(career, L) + CVSections.education(career, L);
  }

  function corporate(career) {
    const L = labels(career);
    return `<div class="layout-corporate">${CVSections.header(career)}${CVSections.summary(career, L)}
      <div class="corp-grid">${CVSections.experience(career, L)}${CVSections.skills(career, L)}</div>
      ${CVSections.projects(career, L)}${CVSections.education(career, L)}${CVSections.languages(career, L)}</div>`;
  }

  function google(career) {
    const L = labels(career);
    return `<div class="layout-google">${CVSections.header(career)}${CVSections.experience(career, L)}${CVSections.education(career, L)}
      ${CVSections.projects(career, L)}${CVSections.skills(career, L)}${CVSections.summary(career, L)}${CVSections.languages(career, L)}</div>`;
  }

  const layouts = { classic, sidebar, twocol, timeline, corporate, google };

  function render(career, layoutId) {
    const lid = layoutId || 'classic';
    const fn = layouts[lid] || layouts.classic;
    return `<div class="cv-paper layout-${lid}">${fn(career)}</div>`;
  }

  return { render, layouts: Object.keys(layouts) };
})();

if (typeof module !== 'undefined') module.exports = LayoutEngine;
