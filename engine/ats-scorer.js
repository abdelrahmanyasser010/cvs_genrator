/**
 * CV Health — rule-based scoring with actionable checklist and colored indicators.
 */
const CVHealth = (function () {
  const ACTION_VERBS = /^(developed|built|implemented|integrated|designed|created|led|managed|optimized|refactored|delivered|architected|collaborated|improved|reduced|increased|automated|deployed|maintained|engineered|programmed|configured|established|streamlined)/i;

  function countSkills(skills) {
    if (!skills) return 0;
    return Object.values(skills).flat().length;
  }

  function hasValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email || '');
  }

  function score(career) {
    const checks = [];
    let points = 0;
    const maxPoints = 100;

    const p = career.personalInfo || {};
    const links = p.links || {};
    const field = career.careerProfile?.field || 'other';
    const projectHeavyFields = ['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'data_analyst'];
    const githubUsefulFields = ['developer', 'data_analyst'];

    if (p.name && p.name.trim()) { points += 8; checks.push({ ok: true, msg: 'Name provided', section: 'personalInfo' }); }
    else checks.push({ ok: false, msg: 'Missing name', section: 'personalInfo', action: 'edit-personal' });

    if (hasValidEmail(p.email)) { points += 8; checks.push({ ok: true, msg: 'Email format valid', section: 'personalInfo' }); }
    else checks.push({ ok: false, msg: 'Invalid or missing email', section: 'personalInfo', action: 'edit-personal' });

    if (p.phone && p.phone.trim()) { points += 5; checks.push({ ok: true, msg: 'Phone provided', section: 'personalInfo' }); }
    else checks.push({ ok: false, msg: 'Missing phone number', section: 'personalInfo', action: 'edit-personal' });

    if (links.linkedin && links.linkedin.trim()) { points += 10; checks.push({ ok: true, msg: 'LinkedIn link present', section: 'personalInfo' }); }
    else checks.push({ ok: false, msg: 'No LinkedIn — adds credibility to your CV', section: 'personalInfo', action: 'edit-personal' });

    if (githubUsefulFields.includes(field)) {
      if (links.github && links.github.trim()) { points += 5; checks.push({ ok: true, msg: 'GitHub link present', section: 'personalInfo' }); }
      else checks.push({ ok: false, msg: 'No GitHub — optional but strengthens developer CVs', section: 'personalInfo', action: 'edit-personal' });
    } else {
      points += 5;
    }

    const summary = career.professionalSummary || '';
    if (summary.length >= 80) { points += 10; checks.push({ ok: true, msg: 'Professional summary present', section: 'summary' }); }
    else checks.push({ ok: false, msg: 'Missing or too short professional summary', section: 'summary', action: 'edit-summary' });

    if (summary.length > 600) checks.push({ ok: false, msg: 'Professional summary too long (>600 chars) — shorten for ATS', section: 'summary', action: 'edit-summary' });
    else if (summary.length > 0) { points += 5; checks.push({ ok: true, msg: 'Summary length appropriate', section: 'summary' }); }

    const exp = career.experience || [];
    const totalBullets = exp.reduce((acc, e) => acc + (e.bullets || []).length, 0);
    if (exp.length >= 2 && totalBullets >= 5) {
      points += 10;
      checks.push({ ok: true, msg: 'Experience section well detailed', section: 'experience' });
    } else if (exp.length >= 1) {
      points += 5;
      checks.push({ ok: false, msg: 'لديك وظيفة واحدة أو عدد قليل من المهام — أنظمة ATS وأصحاب العمل يفضلون ذكر 3-5 نقاط إنجاز مفصلة أو تدريب عملي لدعم خبرتك', section: 'experience', action: 'edit-experience' });
    } else {
      checks.push({ ok: false, msg: 'No work experience added', section: 'experience', action: 'edit-experience' });
    }

    let verbCount = 0;
    exp.forEach(e => (e.bullets || []).forEach(b => { if (ACTION_VERBS.test(b.trim())) verbCount++; }));
    if (verbCount >= 2) { points += 8; checks.push({ ok: true, msg: 'Experience bullets start with action verbs', section: 'experience' }); }
    else checks.push({ ok: false, msg: 'Use action verbs (Developed, Built, Integrated...) in experience bullets', section: 'experience', action: 'edit-experience' });

    const projects = career.projects || [];
    const certs = career.certificates || [];
    if (projectHeavyFields.includes(field)) {
      if (projects.length >= 1) { points += 8; checks.push({ ok: true, msg: 'Projects section filled', section: 'projects' }); }
      else checks.push({ ok: false, msg: 'No projects added — critical for your field', section: 'projects', action: 'edit-projects' });
    } else {
      if (projects.length > 0 || certs.length > 0) {
        points += 8;
        checks.push({ ok: true, msg: 'Projects or professional certifications present', section: 'projects' });
      } else {
        points += 2;
        checks.push({ ok: false, msg: 'لا توجد مشاريع عملية أو دورات وشهادات تدريبية — إضافتها يرفع من قوة سيرتك الذاتية وتميزك عن المتقدمين الآخرين', section: 'projects', action: 'edit-projects' });
      }
    }

    projects.forEach(proj => {
      const hasLink = proj.links && (proj.links.googlePlay || proj.links.appStore || proj.links.github || proj.links.website);
      if (!hasLink && proj.name) {
        checks.push({ ok: false, msg: `Project "${proj.name}" has no link`, section: 'projects', action: 'edit-projects' });
      }
    });
    const linkedProjects = projects.filter(p => p.links && (p.links.googlePlay || p.links.appStore || p.links.github)).length;
    if (linkedProjects > 0) points += 5;

    const skillCount = countSkills(career.skills);
    if (skillCount >= 6 && skillCount <= 18) { points += 10; checks.push({ ok: true, msg: `Skills count optimal (${skillCount})`, section: 'skills' }); }
    else if (skillCount > 18) { points += 7; checks.push({ ok: false, msg: `${skillCount} skills — ATS prefers focusing on 8-16 core competencies`, section: 'skills', action: 'edit-skills' }); }
    else if (skillCount > 0) { points += 4; checks.push({ ok: false, msg: 'Add more relevant skills (aim for 8-15 core competencies)', section: 'skills', action: 'edit-skills' }); }
    else checks.push({ ok: false, msg: 'Skills section empty', section: 'skills', action: 'edit-skills' });

    const eduList = career.education || [];
    const eduValid = eduList.some(e => e.degree && (e.institution || e.school) && (e.period || e.year));
    if (eduValid) {
      points += 5;
      checks.push({ ok: true, msg: 'Education details complete', section: 'education' });
    } else if (eduList.length >= 1) {
      points += 2;
      checks.push({ ok: false, msg: 'بيانات التعليم غير مكتملة — أرجو إضافة اسم الجامعة أو المعهد وسنة التخرج لزيادة المصداقية', section: 'education', action: 'edit-education' });
    } else {
      checks.push({ ok: false, msg: 'No education added', section: 'education', action: 'edit-education' });
    }

    if ((career.languages || []).length >= 1) { points += 3; checks.push({ ok: true, msg: 'Languages listed', section: 'languages' }); }

    const totalChars = summary.length + exp.reduce((a, e) => a + (e.bullets || []).join('').length, 0);
    if (totalChars > 4000) checks.push({ ok: false, msg: 'CV content may be too long for one page — consider trimming', section: 'general', action: 'edit-summary' });

    const percent = Math.min(100, Math.round((points / maxPoints) * 100));
    const stars = percent >= 90 ? 5 : percent >= 75 ? 4 : percent >= 60 ? 3 : percent >= 40 ? 2 : 1;
    const label = percent >= 90 ? 'excellent' : percent >= 75 ? 'good' : percent >= 60 ? 'fair' : 'poor';

    // Group checks by section for CV Health display
    const sections = {
      personalInfo: { status: 'green', checks: [] },
      summary: { status: 'green', checks: [] },
      experience: { status: 'green', checks: [] },
      projects: { status: 'green', checks: [] },
      skills: { status: 'green', checks: [] },
      education: { status: 'green', checks: [] }
    };

    checks.forEach(c => {
      if (sections[c.section]) {
        sections[c.section].checks.push(c);
        if (!c.ok) sections[c.section].status = 'yellow';
      }
    });

    // Determine final status per section
    Object.keys(sections).forEach(key => {
      const hasFail = sections[key].checks.some(c => !c.ok);
      const hasPass = sections[key].checks.some(c => c.ok);
      if (hasFail && !hasPass) sections[key].status = 'red';
      else if (hasFail) sections[key].status = 'yellow';
      else if (hasPass) sections[key].status = 'green';
      else sections[key].status = 'gray';
    });

    return { percent, stars, label, points, maxPoints, checks, sections };
  }

  return { score };
})();

// Backward compatibility alias
const ATSScorer = CVHealth;

if (typeof module !== 'undefined') module.exports = CVHealth;
