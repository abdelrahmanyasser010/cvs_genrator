/**
 * CV section builders — shared across all layouts
 */
const CVSections = (function () {
  const ICO = {
    mail: `<svg class="ci-icon" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m2 7 10 7 10-7"/></svg>`,
    phone: `<svg class="ci-icon" viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1A19.5 19.5 0 0 1 5 12.7a19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.7 12.8 12.8 0 0 0 .7 2.8 2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4 12.8 12.8 0 0 0 2.8.7A2 2 0 0 1 22 17z"/></svg>`,
    pin: `<svg class="ci-icon" viewBox="0 0 24 24"><path d="M21 10c0 7-9 13-9 13S3 17 3 10a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>`,
    linkedin: `<svg class="ci-icon" viewBox="0 0 24 24"><rect x="2" y="9" width="4" height="12"/><circle cx="4" cy="4" r="2"/><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z"/></svg>`,
    github: `<svg class="ci-icon" viewBox="0 0 24 24"><path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.9a3.4 3.4 0 0 0-.9-2.6c3.1-.3 6.4-1.5 6.4-7A5.4 5.4 0 0 0 20 4.8 5.1 5.1 0 0 0 19.9 1S18.7.6 16 2.5a13.4 13.4 0 0 0-7 0C6.3.6 5.1 1 5.1 1A5.1 5.1 0 0 0 5 4.8a5.4 5.4 0 0 0-1.5 3.8c0 5.4 3.3 6.6 6.4 7A3.4 3.4 0 0 0 9 18.1V22"/></svg>`
  };

  function esc(s) {
    if (typeof Safety !== 'undefined') return Safety.escapeHtml(s);
    if (!s) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }

  function safeHref(url) {
    if (typeof Safety !== 'undefined') return Safety.safeUrl(url);
    const raw = String(url || '').trim();
    return /^(https?:|mailto:|tel:)/i.test(raw) ? raw : '';
  }

  function validLink(url) {
    return Boolean(safeHref(url));
  }

  function professionTitle(career) {
    const field = career?.careerProfile?.field || '';
    const ar = career?.meta?.locale === 'ar';
    const titles = {
      developer: ['Software Developer', 'مطور برمجيات'],
      designer: ['Graphic Designer', 'مصمم جرافيك'],
      graphic_designer: ['Graphic Designer', 'مصمم جرافيك'],
      ui_ux_designer: ['UI/UX Designer', 'مصمم تجربة مستخدم'],
      accountant: ['Accountant', 'محاسب'],
      teacher: ['Teacher', 'مدرس'],
      doctor: ['Doctor', 'طبيب'],
      nurse: ['Nurse', 'ممرض'],
      pharmacist: ['Pharmacist', 'صيدلي'],
      engineer: ['Engineer', 'مهندس'],
      hr: ['HR Specialist', 'أخصائي موارد بشرية'],
      marketing: ['Marketing Specialist', 'أخصائي تسويق'],
      lawyer: ['Lawyer', 'محامي'],
      data_analyst: ['Data Analyst', 'محلل بيانات'],
      project_manager: ['Project Manager', 'مدير مشروع']
    };
    const pair = titles[field];
    return pair ? pair[ar ? 1 : 0] : '';
  }

  function header(career) {
    const p = career.personalInfo || {};
    const l = p.links || {};
    const title = p.title || career.careerProfile?.title || '';
    const contacts = [
      { icon: ICO.phone, label: p.phone, href: p.phone ? `tel:${p.phone}` : null },
      { icon: ICO.mail, label: p.email, href: p.email ? `mailto:${p.email}` : null },
      { icon: ICO.pin, label: p.location, href: null },
      { icon: ICO.linkedin, label: 'LinkedIn', href: l.linkedin, requiresValidHref: true },
      { icon: ICO.github, label: 'GitHub', href: l.github, requiresValidHref: true }
    ];
    const visibleContacts = contacts.filter(c => {
      if (!c.label) return false;
      if (c.requiresValidHref) return validLink(c.href);
      return true;
    });
    const ciHtml = visibleContacts.map((c, i, arr) => {
      const href = safeHref(c.href);
      const inner = href ? `<a href="${esc(href)}">${c.icon || ''}${esc(c.label)}</a>` : `<span>${c.icon || ''}${esc(c.label)}</span>`;
      const dot = i < arr.length - 1 ? `<span class="dot">·</span>` : '';
      return `<span class="ci">${inner}</span>${dot}`;
    }).join('');
      const photoUrl = p.photo || '';
      const showPhoto = Boolean(photoUrl && career.meta?.showPhoto);
      const photoHtml = showPhoto ? `<div class="cv-header-photo" style="margin-inline-end:16px;flex-shrink:0;"><img src="${esc(photoUrl)}" alt="" style="width:76px;height:76px;border-radius:50%;object-fit:cover;border:2.5px solid var(--primary,#2563eb);box-shadow:0 2px 8px rgba(0,0,0,0.08);"></div>` : '';
      return `<header class="cv-header" onclick="if(typeof Editor!=='undefined'&&Editor.openEditPanel)Editor.openEditPanel('personalInfo');" style="cursor:pointer;${showPhoto ? 'display:flex;align-items:center;flex-wrap:wrap;' : ''}" title="${career.meta?.locale==='ar'?'اضغط لتعديل الاسم والمسمى الوظيفي':'Click to edit name and job title'}">${photoHtml}<div style="flex:1;min-width:200px;"><h1>${esc(p.name)}</h1>${title ? `<div class="cv-subtitle">${esc(title)}</div>` : ''}<div class="cv-contacts">${ciHtml}</div></div></header>`;
    }

  function summary(career, labels) {
    return `<section class="cv-section"><h2 class="cv-section-title">${esc(labels.summary)}</h2><p>${esc(career.professionalSummary)}</p></section>`;
  }

  function experience(career, labels) {
    const items = (career.experience || []).map(e => {
      const linkUrl = e.url || e.link || e.verificationUrl;
      const linkHtml = validLink(linkUrl) ? ` <a href="${esc(safeHref(linkUrl))}" target="_blank" style="font-size:0.85em; color:var(--primary, #2563eb); text-decoration:none; margin-left:6px;">🔗 Link</a>` : '';
      return `
      <div class="cv-entry">
        <div class="cv-entry-head">
          <div class="cv-entry-left"><span class="cv-role">${esc(e.role)}</span><span style="color:#ccc">·</span><span class="cv-company">${esc(e.company)}</span>${linkHtml}</div>
          <span class="cv-period">${esc(e.period)}</span>
        </div>
        <ul class="cv-ul">${(e.bullets || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
      </div>`;
    }).join('');
    return `<section class="cv-section"><h2 class="cv-section-title">${esc(labels.experience)}</h2><div>${items}</div></section>`;
  }

  function experienceTimeline(career, labels) {
    const items = (career.experience || []).map(e => {
      const linkUrl = e.url || e.link || e.verificationUrl;
      const linkHtml = validLink(linkUrl) ? ` <a href="${esc(safeHref(linkUrl))}" target="_blank" style="font-size:0.85em; color:var(--primary, #2563eb); text-decoration:none; margin-left:6px;">🔗 Link</a>` : '';
      return `
      <div class="cv-timeline-item">
        <div class="cv-timeline-dot"></div>
        <div class="cv-timeline-content">
          <div class="cv-entry-head"><span class="cv-role">${esc(e.role)}</span> · <span class="cv-company">${esc(e.company)}</span> <span class="cv-period">${esc(e.period)}</span>${linkHtml}</div>
          <ul class="cv-ul">${(e.bullets || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
        </div>
      </div>`;
    }).join('');
    return `<section class="cv-section cv-timeline"><h2 class="cv-section-title">${esc(labels.experience)}</h2>${items}</section>`;
  }

  function projects(career, labels) {
    const items = (career.projects || []).map(p => {
      const links = [];
      if (validLink(p.links?.googlePlay)) links.push(`<a href="${esc(safeHref(p.links.googlePlay))}" target="_blank">Google Play</a>`);
      if (validLink(p.links?.appStore || p.links?.ios)) links.push(`<a href="${esc(safeHref(p.links.appStore || p.links.ios))}" target="_blank">App Store</a>`);
      if (validLink(p.links?.github)) links.push(`<a href="${esc(safeHref(p.links.github))}" target="_blank">GitHub</a>`);
      if (validLink(p.links?.website || p.url)) links.push(`<a href="${esc(safeHref(p.links?.website || p.url))}" target="_blank">Live Demo</a>`);
      return `<div class="cv-project"><div class="cv-proj-head"><span class="cv-proj-name">${esc(p.name)}</span><div class="cv-proj-links">${links.join('')}</div></div>
        <div class="cv-proj-desc">${esc(p.desc)}</div><ul class="cv-ul">${(p.bullets || []).map(b => `<li>${esc(b)}</li>`).join('')}</ul>
        ${p.tech ? `<div class="cv-tech"><strong>Tech:</strong> ${esc(p.tech)}</div>` : ''}</div>`;
    }).join('');
    if (!items) return '';
    return `<section class="cv-section"><h2 class="cv-section-title">${esc(labels.projects)}</h2><div>${items}</div></section>`;
  }

  function skills(career, labels) {
    const isAr = career.meta?.locale === 'ar' || (labels.skills && labels.skills.includes('مهارات'));
    const rows = Object.entries(career.skills || {}).map(([cat, vals]) => {
      let catName = cat || '';
      if (!catName || catName.toLowerCase() === 'core' || catName.toLowerCase() === 'skills' || catName === 'المهارات' || catName === 'مهارات' || catName === 'عام' || catName.toLowerCase() === 'general' || catName.trim() === (labels.skills || '').trim()) {
        catName = isAr ? 'المهارات الأساسية' : 'Core Competencies';
      }
      const arr = Array.isArray(vals) ? vals : typeof vals === 'string' ? vals.split(',').map(s => s.trim()).filter(Boolean) : [String(vals || '')].filter(Boolean);
      return `<div class="cv-skill-row"><span class="cv-skill-cat">${esc(catName)}</span><span class="cv-skill-val">${arr.map(v => esc(v)).join(', ')}</span></div>`;
    }).join('');
    return `<section class="cv-section"><h2 class="cv-section-title">${esc(labels.skills)}</h2><div class="cv-skills-table">${rows}</div></section>`;
  }

  function education(career, labels) {
    const items = (career.education || []).map(e => {
      const linkUrl = e.url || e.certUrl || e.link || e.verificationUrl;
      const linkHtml = validLink(linkUrl) ? ` <a href="${esc(safeHref(linkUrl))}" target="_blank" style="font-size:0.85em; color:var(--primary, #2563eb); text-decoration:none; margin-left:6px;">🔗 Verify Cert</a>` : '';
      return `<div class="cv-edu-row"><div class="cv-edu-left"><span class="degree">${esc(e.degree)}</span><span class="inst"> · ${esc(e.institution || e.school)}</span>${linkHtml}</div><span class="cv-edu-period">${esc(e.period || e.year)}</span></div>`;
    }).join('');
    if (!items) return '';
    return `<section class="cv-section"><h2 class="cv-section-title">${esc(labels.education)}</h2><div>${items}</div></section>`;
  }


  function certificates(career, labels) {
    const items = (career.certificates || []).map(c => {
      const link = validLink(c.url) ? ` <a href="${esc(safeHref(c.url))}" target="_blank" rel="noopener" style="font-size:0.82em;color:var(--primary,#2563eb);text-decoration:none;">↗ Verify</a>` : '';
      return `<div class="cv-edu-row"><div class="cv-edu-left"><span class="degree">${esc(c.name)}</span>${c.issuer ? `<span class="inst"> · ${esc(c.issuer)}</span>` : ''}${link}</div><span class="cv-edu-period">${esc(c.year)}</span></div>`;
    }).join('');
    if (!items) return '';
    return `<section class="cv-section"><h2 class="cv-section-title">${esc(labels.certificates || (career.meta?.locale === 'ar' ? 'الشهادات والتراخيص' : 'Certifications & Licenses'))}</h2><div>${items}</div></section>`;
  }

  function awards(career, labels) {
    const items = (career.awards || []).map(award => `<div class="cv-entry"><div class="cv-entry-head"><div class="cv-entry-left"><span class="cv-role">${esc(award.name)}</span>${award.issuer ? `<span style="color:#ccc">·</span><span class="cv-company">${esc(award.issuer)}</span>` : ''}</div><span class="cv-period">${esc(award.year)}</span></div>${award.description ? `<div class="cv-proj-desc">${esc(award.description)}</div>` : ''}</div>`).join('');
    if (!items) return '';
    return `<section class="cv-section"><h2 class="cv-section-title">${esc(labels.awards || (career.meta?.locale === 'ar' ? 'الجوائز والتقدير' : 'Awards'))}</h2><div>${items}</div></section>`;
  }

  function languages(career, labels) {
    const items = (career.languages || []).map(l => {
      const lang = typeof l === 'string' ? l : l.lang;
      const level = typeof l === 'string' ? '' : l.level;
      return `<span><span class="lang-name">${esc(lang)}</span>${level ? ` — ${esc(level)}` : ''}</span>`;
    }).join('');
    if (!items) return '';
    return `<section class="cv-section"><h2 class="cv-section-title">${esc(labels.languages)}</h2><div class="cv-langs">${items}</div></section>`;
  }

  return { header, summary, experience, experienceTimeline, projects, skills, education, certificates, awards, languages, esc };
})();

