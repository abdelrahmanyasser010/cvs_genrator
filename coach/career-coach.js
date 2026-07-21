/**
 * Career Coach — 5-Level Analysis Engine
 * Level 1: Structural Analysis  (is it complete?)
 * Level 2: Quality Analysis     (are bullets good? measurable?)
 * Level 3: ATS Keyword Gap      (missing keywords?)
 * Level 4: Career Advice        (level vs. CV mismatch?)
 * Level 5: Action Plan Roadmap  (step-by-step path to improve score)
 */
const CareerCoach = (function () {

  // ─── ATS Keywords per field ───────────────────────────────────────────────
  const FIELD_KEYWORDS = {
    developer: ['JavaScript', 'React', 'Node.js', 'REST API', 'Git', 'SQL', 'CI/CD', 'TypeScript', 'Agile', 'Testing'],
    ui_ux_designer: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design System', 'Usability Testing'],
    designer: ['Adobe Photoshop', 'Adobe Illustrator', 'Typography', 'Brand Identity', 'Figma', 'Color Theory'],
    graphic_designer: ['Adobe Photoshop', 'Illustrator', 'InDesign', 'Brand Identity', 'Print Design'],
    marketing: ['SEO', 'Google Ads', 'Social Media', 'Analytics', 'Content Strategy', 'ROI', 'CRM'],
    accountant: ['Excel', 'GAAP', 'IFRS', 'ERP', 'Financial Reporting', 'Reconciliation', 'Tax', 'Audit'],
    teacher: ['Curriculum', 'Lesson Planning', 'Classroom Management', 'Student Assessment', 'Differentiation'],
    doctor: ['Patient Care', 'Diagnosis', 'Clinical Examination', 'Treatment Planning', 'EHR', 'BLS'],
    nurse: ['Patient Monitoring', 'Medication Administration', 'Vital Signs', 'BLS', 'Care Planning', 'ICU'],
    pharmacist: ['Drug Interactions', 'Patient Counseling', 'GMP', 'Inventory', 'Clinical Pharmacy', 'FDA'],
    sales: ['CRM', 'Lead Generation', 'Pipeline Management', 'Negotiation', 'Revenue Growth', 'KPIs'],
    hr: ['Recruitment', 'Onboarding', 'Performance Management', 'Employee Relations', 'HR Policies', 'ATS'],
    data_analyst: ['SQL', 'Power BI', 'Excel', 'Python', 'Data Cleaning', 'Dashboard', 'Tableau', 'Statistics'],
    project_manager: ['Agile', 'Scrum', 'Risk Management', 'Stakeholder Management', 'Jira', 'PMP', 'Budget'],
    business_analyst: ['Requirements Gathering', 'Process Mapping', 'BPMN', 'Stakeholders', 'SQL', 'KPIs'],
    lawyer: ['Contract Law', 'Litigation', 'Legal Research', 'Compliance', 'Negotiation', 'Due Diligence'],
    engineer: ['AutoCAD', 'Project Management', 'Quality Control', 'Technical Drawing', 'Safety', 'ISO'],
    other: ['Communication', 'Problem Solving', 'Teamwork', 'Microsoft Office', 'Planning', 'Reporting']
  };

  // ─── Career Level Maps ────────────────────────────────────────────────────
  const LEVEL_EXP_YEARS = { fresh: 0, junior: 2, mid: 4, senior: 7 };
  const LEVEL_LABEL = {
    fresh: { en: 'Fresh Graduate', ar: 'حديث التخرج' },
    junior: { en: 'Junior', ar: 'مبتدئ' },
    mid: { en: 'Mid-Level', ar: 'متوسط' },
    senior: { en: 'Senior', ar: 'خبير/أقدم' }
  };
  const LEVEL_NEXT = { fresh: 'junior', junior: 'mid', mid: 'senior' };
  const LEVEL_NEEDS = {
    fresh_to_junior: {
      developer: ['Build 3+ real projects', 'Get internship experience', 'Master Git & GitHub', 'Learn REST APIs'],
      designer: ['Build portfolio of 10+ designs', 'Complete Figma advanced course', 'Freelance 2-3 projects'],
      accountant: ['Pass CMA Level 1', 'Get 6-month internship', 'Master Excel advanced functions'],
      other: ['1-2 internships', 'Relevant certifications', 'Personal projects in your field']
    },
    junior_to_mid: {
      developer: ['Deliver 2+ production features', 'Code review experience', 'System design basics', 'Testing skills'],
      designer: ['Lead end-to-end project', 'Present to stakeholders', 'Design system contributions'],
      accountant: ['ERP system experience', 'Financial reporting ownership', 'Team supervision'],
      other: ['Own a complete project', 'Mentor a new joiner', 'Cross-functional collaboration']
    },
    mid_to_senior: {
      developer: ['Lead a team / architecture decisions', 'Mentored junior devs', 'Designed scalable systems', 'Technical interviews'],
      designer: ['Built or led a Design System', 'Cross-team leadership', 'Define design strategy'],
      accountant: ['Managed P&L', 'Supervised a team', 'Strategic financial planning'],
      other: ['Organizational impact', 'Budget ownership', 'Strategic leadership']
    }
  };

  const WEAK_VERB_PATTERNS = /^(responsible for|worked on|helped|assisted|participated in|was part of|did|made|used|involved in|part of)/i;
  const HAS_NUMBER = /\d+[\s%$x+k]|increased|reduced|improved|delivered|saved|grew/i;

  // ─── LEVEL 1: Structural Analysis ────────────────────────────────────────
  function analyzeStructure(career) {
    const p = career.personalInfo || {};
    const sections = [];

    const hasName = !!(p.name && p.name.trim());
    const hasEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email || '');
    const hasPhone = !!(p.phone && p.phone.trim());
    const hasLinkedIn = !!(p.links?.linkedin?.trim());
    const hasSummary = (career.professionalSummary || '').length >= 80;
    const hasExperience = (career.experience || []).length >= 1;
    const hasSkills = Object.values(career.skills || {}).flat().length >= 4;
    const hasEducation = (career.education || []).some(e => e.degree && (e.institution || e.school));
    const hasProjects = (career.projects || []).length >= 1;

    sections.push({ key: 'contact', label: 'Contact Info', ok: hasName && hasEmail && hasPhone, icon: '👤', detail: hasName && hasEmail && hasPhone ? 'Complete' : 'Missing: ' + [!hasName && 'name', !hasEmail && 'email', !hasPhone && 'phone'].filter(Boolean).join(', ') });
    sections.push({ key: 'linkedin', label: 'LinkedIn', ok: hasLinkedIn, icon: '🔗', detail: hasLinkedIn ? 'Present' : 'Missing — adds credibility', action: 'edit-personal' });
    sections.push({ key: 'summary', label: 'Professional Summary', ok: hasSummary, icon: '📝', detail: hasSummary ? 'Good length' : 'Too short or missing', action: 'edit-summary' });
    sections.push({ key: 'experience', label: 'Work Experience', ok: hasExperience, icon: '💼', detail: hasExperience ? `${career.experience.length} role(s)` : 'No experience added', action: 'edit-experience' });
    sections.push({ key: 'skills', label: 'Skills', ok: hasSkills, icon: '🛠️', detail: hasSkills ? `${Object.values(career.skills || {}).flat().length} skills` : 'Too few skills', action: 'edit-skills' });
    sections.push({ key: 'education', label: 'Education', ok: hasEducation, icon: '🎓', detail: hasEducation ? 'Complete' : 'Incomplete or missing', action: 'edit-education' });
    sections.push({ key: 'projects', label: 'Projects', ok: hasProjects, icon: '🚀', detail: hasProjects ? `${career.projects.length} project(s)` : 'None added', action: 'edit-projects' });

    const completed = sections.filter(s => s.ok).length;
    const score = Math.round((completed / sections.length) * 100);

    return { sections, score, completed, total: sections.length };
  }

  // ─── LEVEL 2: Quality Analysis ────────────────────────────────────────────
  function analyzeQuality(career) {
    const issues = [];
    const exp = career.experience || [];
    const summary = career.professionalSummary || '';

    // Summary quality
    if (summary.length >= 80 && summary.length < 150) {
      issues.push({ type: 'warning', icon: '📝', title: 'Summary is too short', detail: 'Aim for 150-300 characters with your top 2-3 strengths and years of experience.', action: 'edit-summary' });
    }
    if (summary && WEAK_VERB_PATTERNS.test(summary.split('\n')[0])) {
      issues.push({ type: 'warning', icon: '📝', title: 'Summary starts with weak phrasing', detail: 'Start your summary with your title and value, e.g. "Senior Frontend Developer with 5+ years..."', action: 'edit-summary' });
    }

    // Experience bullet quality
    let weakBullets = 0, totalBullets = 0, noMetrics = 0;
    exp.forEach(e => {
      (e.bullets || []).forEach(b => {
        totalBullets++;
        if (WEAK_VERB_PATTERNS.test(b.trim())) weakBullets++;
        if (!HAS_NUMBER.test(b)) noMetrics++;
      });
    });

    if (totalBullets > 0 && weakBullets > 0) {
      issues.push({
        type: 'error', icon: '⚠️', title: `${weakBullets} weak bullet(s) found`,
        detail: 'Replace phrases like "Responsible for..." or "Helped with..." with action verbs.',
        example: { bad: 'Responsible for frontend development.', good: 'Built 12 responsive pages reducing load time by 34%.' },
        action: 'edit-experience'
      });
    }

    if (totalBullets > 0 && noMetrics > totalBullets * 0.7) {
      issues.push({
        type: 'warning', icon: '📊', title: 'Very few measurable achievements',
        detail: 'Numbers make your CV 40% more likely to pass ATS. Add metrics to your bullets.',
        example: { bad: 'Improved app performance.', good: 'Improved app load time by 60% (from 4.2s → 1.7s).' },
        action: 'edit-experience'
      });
    }

    // Skills quality
    const skillCount = Object.values(career.skills || {}).flat().length;
    if (skillCount > 20) {
      issues.push({ type: 'warning', icon: '🛠️', title: `Too many skills listed (${skillCount})`, detail: 'ATS prefers 8-16 focused core skills. Remove generic ones like "Microsoft Word".', action: 'edit-skills' });
    }

    // Projects quality
    const projs = career.projects || [];
    const projsNoDesc = projs.filter(p => !p.description || p.description.length < 50);
    if (projsNoDesc.length > 0) {
      issues.push({ type: 'warning', icon: '🚀', title: `${projsNoDesc.length} project(s) with weak/no description`, detail: 'Each project needs impact: what it does, tech used, and measurable result.', action: 'edit-projects' });
    }

    const quality = issues.filter(i => i.type === 'error').length === 0 ? (issues.length === 0 ? 'excellent' : 'good') : 'needs_work';
    return { issues, quality };
  }

  // ─── LEVEL 3: ATS Keyword Gap ─────────────────────────────────────────────
  function analyzeATS(career) {
    const field = career.careerProfile?.field || 'other';
    const keywords = FIELD_KEYWORDS[field] || FIELD_KEYWORDS.other;

    // All text from the CV
    const cvText = [
      career.professionalSummary || '',
      ...(career.experience || []).flatMap(e => e.bullets || []),
      ...Object.values(career.skills || {}).flat(),
      ...(career.projects || []).map(p => `${p.name} ${p.description} ${(p.technologies || []).join(' ')}`)
    ].join(' ').toLowerCase();

    const present = [];
    const missing = [];

    keywords.forEach(kw => {
      if (cvText.includes(kw.toLowerCase())) present.push(kw);
      else missing.push(kw);
    });

    const coverage = Math.round((present.length / keywords.length) * 100);
    return { present, missing, coverage, total: keywords.length };
  }

  // ─── LEVEL 4: Career Advice ───────────────────────────────────────────────
  function analyzeCareer(career) {
    const level = career.careerProfile?.level || 'mid';
    const field = career.careerProfile?.field || 'other';
    const exp = career.experience || [];
    const totalYears = exp.length; // rough approximation
    const advice = [];

    const levelLabel = LEVEL_LABEL[level]?.en || level;
    const expectedYears = LEVEL_EXP_YEARS[level] || 0;

    // Level vs experience mismatch
    if (level === 'senior' && exp.length < 3) {
      advice.push({ type: 'critical', icon: '🎯', title: 'CV looks Junior, not Senior', detail: `You marked yourself as Senior but only have ${exp.length} role(s). Seniors need to show leadership, architecture decisions, and team impact.` });
    }
    if (level === 'mid' && exp.length < 2) {
      advice.push({ type: 'warning', icon: '💡', title: 'Mid-level CV needs more depth', detail: 'Add measurable ownership: projects you led, systems you improved, KPIs you owned.' });
    }
    const projectHeavyFields = ['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'data_analyst'];
    if (level === 'fresh' && exp.length === 0) {
      const detail = projectHeavyFields.includes(field)
        ? 'No work experience yet? Add genuine projects, internships, or freelance work that demonstrate your skills.'
        : 'No work experience yet? Add genuine internships, training, volunteering, or practical responsibilities relevant to your profession.';
      advice.push({ type: 'info', icon: '', title: 'Strengthen your evidence', detail });
    }

    if (['fresh', 'junior'].includes(level) && projectHeavyFields.includes(field) && (career.projects || []).length === 0) {
      advice.push({ type: 'warning', icon: '', title: 'Add practical project evidence', detail: 'For this profession, one or two genuine projects can demonstrate practical ability. Add only work you actually completed.', action: 'edit-projects' });
    }

    // Summary missing career narrative
    const summary = career.professionalSummary || '';
    if (level === 'senior' && !summary.includes('led') && !summary.includes('managed') && !summary.includes('team') && !summary.includes('قاد') && !summary.includes('فريق')) {
      advice.push({ type: 'warning', icon: '👥', title: 'Senior CV should show leadership', detail: 'Your summary doesn\'t mention leadership, team management, or strategic impact. Add these signals.' });
    }

    // Career path tip
    const nextLevel = LEVEL_NEXT[level];
    if (nextLevel) {
      const needs = LEVEL_NEEDS[`${level}_to_${nextLevel}`]?.[field] || LEVEL_NEEDS[`${level}_to_${nextLevel}`]?.other || [];
      advice.push({ type: 'path', icon: '📈', title: `Path to ${LEVEL_LABEL[nextLevel]?.en}`, detail: `To advance to the next level, focus on:`, items: needs });
    }

    return { advice, level, levelLabel };
  }

  // ─── LEVEL 5: Action Plan Roadmap ─────────────────────────────────────────
  function buildActionPlan(career) {
    const structural = analyzeStructure(career);
    const quality = analyzeQuality(career);
    const ats = analyzeATS(career);
    const careerAnalysis = analyzeCareer(career);

    const steps = [];

    // Priority 1: Structure (critical gaps first)
    structural.sections.filter(s => !s.ok).forEach(s => {
      steps.push({ priority: 1, icon: s.icon, action: s.key, label: `Add ${s.label}`, impact: '+10-15 pts', sectionKey: s.action || null });
    });

    // Priority 2: Quality issues
    quality.issues.filter(i => i.type === 'error').forEach(i => {
      steps.push({ priority: 2, icon: i.icon, label: i.title, detail: i.detail, impact: '+8-12 pts', sectionKey: i.action || null });
    });

    // Priority 3: ATS missing keywords
    if (ats.missing.length > 0) {
      steps.push({ priority: 3, icon: '🔍', label: `Add missing keywords to your CV`, detail: ats.missing.slice(0, 5).join(', '), impact: '+5-10 pts', sectionKey: 'edit-skills' });
    }

    // Priority 4: Career advice critical items
    careerAnalysis.advice.filter(a => a.type === 'critical').forEach(a => {
      steps.push({ priority: 4, icon: a.icon, label: a.title, detail: a.detail, impact: 'High impact', sectionKey: a.action || null });
    });

    // Priority 5: Quality warnings
    quality.issues.filter(i => i.type === 'warning').forEach(i => {
      steps.push({ priority: 5, icon: i.icon, label: i.title, detail: i.detail, impact: '+3-6 pts', sectionKey: i.action || null });
    });

    // Deduplicate by label
    const seen = new Set();
    const unique = steps.filter(s => { if (seen.has(s.label)) return false; seen.add(s.label); return true; });

    return unique.slice(0, 7); // Max 7 action steps
  }

  // ─── Full Report ──────────────────────────────────────────────────────────
  function fullReport(career) {
    return {
      structural: analyzeStructure(career),
      quality: analyzeQuality(career),
      ats: analyzeATS(career),
      career: analyzeCareer(career),
      actionPlan: buildActionPlan(career)
    };
  }

  return { analyzeStructure, analyzeQuality, analyzeATS, analyzeCareer, buildActionPlan, fullReport };
})();
