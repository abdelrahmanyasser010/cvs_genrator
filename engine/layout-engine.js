/**
 * Layout engine — 6 structural architectures
 * Note: This is now called by TemplateSelector which bundles layout + theme
 */
const LayoutEngine = (function () {
  function labels(career) {
    if (typeof I18n !== 'undefined' && I18n.getCvLabels) return I18n.getCvLabels();
    return { summary: 'Professional Summary', experience: 'Experience', projects: 'Projects', skills: 'Skills', education: 'Education', languages: 'Languages' };
  }

  function renderOrdered(career, L) {
    const order = career?.meta?.sectionOrder || ['summary', 'experience', 'education', 'projects', 'skills', 'languages'];
    const map = {
      summary: () => CVSections.summary(career, L),
      experience: () => CVSections.experience(career, L),
      education: () => CVSections.education(career, L),
      projects: () => CVSections.projects(career, L),
      skills: () => CVSections.skills(career, L),
      languages: () => CVSections.languages(career, L)
    };
    return CVSections.header(career) + order.map(k => (map[k] ? map[k]() : '')).join('');
  }

  function classic(career) {
    const L = labels(career);
    return renderOrdered(career, L);
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

  function canva_sidebar(career) {
    const L = labels(career);
    const p = career.personalInfo || {};
    const photoUrl = p.photo || '';
    const showPhoto = Boolean(photoUrl && career.meta?.showPhoto);
    const photoHtml = showPhoto ? `<div style="text-align:center;margin-bottom:16px;"><img src="${CVSections.esc(photoUrl)}" alt="" style="width:104px;height:104px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 4px 14px rgba(0,0,0,0.2);"></div>` : '';
    
    const contacts = [
      p.phone ? `<div>📞 ${CVSections.esc(p.phone)}</div>` : '',
      p.email ? `<div>✉️ ${CVSections.esc(p.email)}</div>` : '',
      p.location ? `<div>📍 ${CVSections.esc(p.location)}</div>` : ''
    ].filter(Boolean).join('');

    const side = `
      <div style="background:var(--primary, #0f766e);color:#fff;padding:28px 20px;height:100%;box-sizing:border-box;">
        ${photoHtml}
        <div onclick="if(typeof Editor!=='undefined'&&Editor.openEditPanel)Editor.openEditPanel('personalInfo');" style="text-align:center;margin-bottom:20px;cursor:pointer;" title="اضغط لتعديل الاسم والمسمى الوظيفي">
          <h1 style="font-size:21px;color:#fff;margin:0 0 6px;font-weight:800;line-height:1.2;">${CVSections.esc(p.name || '')}</h1>
          <div style="font-size:13.5px;color:rgba(255,255,255,0.9);font-weight:600;">${CVSections.esc(p.title || career.careerProfile?.title || '')}</div>
        </div>
        ${contacts ? `<div style="background:rgba(255,255,255,0.12);padding:12px;border-radius:8px;margin-bottom:20px;font-size:12px;line-height:1.7;color:#fff;">${contacts}</div>` : ''}
        <div style="margin-bottom:20px;">
          <div style="font-size:12px;font-weight:800;color:#fff;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:5px;margin-bottom:10px;text-transform:uppercase;">${CVSections.esc(L.skills)}</div>
          <div style="color:#fff;">${CVSections.skills(career, L)}</div>
        </div>
        <div>
          <div style="font-size:12px;font-weight:800;color:#fff;border-bottom:1px solid rgba(255,255,255,0.3);padding-bottom:5px;margin-bottom:10px;text-transform:uppercase;">${CVSections.esc(L.languages)}</div>
          <div style="color:#fff;">${CVSections.languages(career, L)}</div>
        </div>
      </div>
    `;

    const main = `
      <div style="padding:28px 24px;box-sizing:border-box;">
        ${CVSections.summary(career, L)}
        ${CVSections.experience(career, L)}
        ${CVSections.education(career, L)}
        ${CVSections.projects(career, L)}
      </div>
    `;

    return `<div class="layout-canva-sidebar" style="display:grid;grid-template-columns:32% 68%;min-height:100%;">${side}${main}</div>`;
  }

  function canva_header(career) {
    const L = labels(career);
    const p = career.personalInfo || {};
    const photoUrl = p.photo || '';
    const showPhoto = Boolean(photoUrl && career.meta?.showPhoto);
    const photoHtml = showPhoto ? `<div style="flex-shrink:0;"><img src="${CVSections.esc(photoUrl)}" alt="" style="width:84px;height:84px;border-radius:50%;object-fit:cover;border:3px solid #fff;box-shadow:0 4px 10px rgba(0,0,0,0.2);"></div>` : '';

    const headerBanner = `
      <div onclick="if(typeof Editor!=='undefined'&&Editor.openEditPanel)Editor.openEditPanel('personalInfo');" style="background:linear-gradient(135deg, var(--primary, #1e293b) 0%, #334155 100%);color:#fff;padding:26px 30px;display:flex;align-items:center;justify-content:space-between;gap:20px;border-radius:6px 6px 0 0;cursor:pointer;" title="اضغط لتعديل الاسم والمسمى الوظيفي">
        <div style="flex:1;">
          <h1 style="font-size:26px;color:#fff;margin:0 0 5px;font-weight:800;">${CVSections.esc(p.name || '')}</h1>
          <div style="font-size:14px;color:rgba(255,255,255,0.9);font-weight:600;margin-bottom:12px;">${CVSections.esc(p.title || career.careerProfile?.title || '')}</div>
          <div style="display:flex;flex-wrap:wrap;gap:14px;font-size:12px;color:rgba(255,255,255,0.95);">
            ${p.phone ? `<span>📞 ${CVSections.esc(p.phone)}</span>` : ''}
            ${p.email ? `<span>✉️ ${CVSections.esc(p.email)}</span>` : ''}
            ${p.location ? `<span>📍 ${CVSections.esc(p.location)}</span>` : ''}
          </div>
        </div>
        ${photoHtml}
      </div>
    `;

    const bodyContent = `
      <div style="padding:26px 28px;">
        ${CVSections.summary(career, L)}
        ${CVSections.experience(career, L)}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:12px;">
          <div>${CVSections.education(career, L)}</div>
          <div>${CVSections.skills(career, L)}</div>
        </div>
        ${CVSections.projects(career, L)}
        ${CVSections.languages(career, L)}
      </div>
    `;

    return `<div class="layout-canva-header">${headerBanner}${bodyContent}</div>`;
  }

  const layouts = { classic, sidebar, twocol, timeline, corporate, google, canva_sidebar, canva_header };

  function render(career, layoutId) {
    const lid = layoutId || 'classic';
    const fn = layouts[lid] || layouts.classic;
    const accent = career?.meta?.accentColor || '';
    const font = career?.meta?.fontFamily || '';
    const styleAttr = (accent || font) ? `style="${accent ? `--primary:${accent};--accent:${accent};` : ''}${font ? `font-family:'${font}',sans-serif !important;` : ''}"` : '';
    return `<div class="cv-paper layout-${lid}" ${styleAttr}>${fn(career)}</div>`;
  }

  return { render, layouts: Object.keys(layouts) };
})();

if (typeof module !== 'undefined') module.exports = LayoutEngine;
