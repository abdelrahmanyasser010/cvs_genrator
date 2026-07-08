/**
 * Smart suggestions — missing data nudges and cross-section hints
 * Enhanced with intelligent context-aware recommendations
 */
const Suggestions = (function () {
  function getMissingDataNudges(career) {
    const nudges = [];
    const p = career.personalInfo || {};
    const l = p.links || {};
    const field = career.careerProfile?.field || 'other';
    const level = career.careerProfile?.level || 'mid';

    // Personal info suggestions based on profession
    if (!l.linkedin?.trim()) {
      nudges.push({ type: 'info', section: 'personalInfo', msg: 'LinkedIn is optional but significantly strengthens your CV.', field: 'linkedin' });
    }
    if (!l.github?.trim() && field === 'developer') {
      nudges.push({ type: 'info', section: 'personalInfo', msg: 'GitHub helps recruiters verify your code. Consider adding it.', field: 'github' });
    }
    if (!l.portfolio?.trim() && ['designer', 'graphic_designer', 'ui_ux_designer', 'architect', 'marketer', 'marketing'].includes(field)) {
      nudges.push({ type: 'info', section: 'personalInfo', msg: 'A portfolio showcases your best work. Add a link to stand out.', field: 'portfolio' });
    }
    
    // Summary suggestions
    if (!career.professionalSummary?.trim()) {
      nudges.push({ type: 'action', section: 'summary', msg: 'Want me to write your professional summary?', action: 'generate-summary' });
    } else if (career.professionalSummary.length < 50) {
      nudges.push({ type: 'warning', section: 'summary', msg: 'Your summary is too short. Add more detail about your expertise.', action: 'edit-summary' });
    }
    
    // Experience suggestions based on level
    const expCount = (career.experience || []).length;
    if (expCount === 0) {
      nudges.push({ type: 'warning', section: 'experience', msg: 'Add your work experience to show your career progression.', action: 'edit-experience' });
    } else if (expCount === 1) {
      nudges.push({ type: 'info', section: 'experience', msg: '💡 لديك وظيفة واحدة فقط في الخبرات — ينصح بإضافة التدريب العملي (Internship)، أو مشاريع التخرج، أو الدورات التدريبية لتعزيز سيرتك الذاتية ورفع تقييم ה-ATS.', action: 'edit-experience' });
    } else if (expCount < 2 && level !== 'fresh') {
      nudges.push({ type: 'info', section: 'experience', msg: 'Consider adding more roles to show career growth.', action: 'edit-experience' });
    }
    
    // Level specific guidance
    if (level === 'fresh') {
      nudges.push({ type: 'info', section: 'experience', msg: '💡 حديث تخرج (Fresh Grad)؟ ركز على مشاريع التخرج، التدريب الصيفي، والدورات العملية لتعويض نقص الخبرة.', action: 'edit-projects' });
    } else if (level === 'junior') {
      nudges.push({ type: 'info', section: 'experience', msg: '💡 كمبتدئ (Junior)، وضح الأدوات التقنية التي تستخدمها يومياً وكيف تلتزم بالمعايير وحل المشكلات.', action: 'edit-experience' });
    } else if (level === 'mid') {
      nudges.push({ type: 'info', section: 'experience', msg: '💡 في المستوى المتوسط (Mid-Level)، يبحث مسؤول التوظيف عن أرقام ونتائج قياسية (KPIs, ROI) ومبادرات مستقلة.', action: 'edit-experience' });
    } else if (level === 'senior') {
      nudges.push({ type: 'info', section: 'experience', msg: '💡 كخبير أو تنفيذي (Senior)، يجب أن تبرز مهارات القيادة (Leadership)، إدارة الميزانيات، والرؤية الاستراتيجية.', action: 'edit-experience' });
    }
    
    // Profession specific acronyms & abbreviations (الاختصارات)
    const professionAcronyms = {
      developer: 'API, CI/CD, Git, SQL, OOP, REST, AWS, Agile',
      doctor: 'EMR, EKG, BLS, ACLS, CPR, ICU, EHR',
      dentist: 'DDS, DMD, RCT, CAD/CAM, CBCT, PPE',
      nurse: 'RN, BLS, ACLS, ICU, EMR, IV, Triage, CPR',
      pharmacist: 'OTC, FDA, GMP, SOP, EMR, Pharmacokinetics',
      teacher: 'LMS, ESL, STEM, IEP, TESOL, SAT, Curriculum',
      accountant: 'GAAP, IFRS, VAT, P&L, ERP, CPA, CMA, ROI',
      lawyer: 'LLB, LLM, Arbitration, Compliance, IP, Litigation',
      hr: 'KPI, ATS, HRIS, ROI, OSHA, Payroll, Talent Acquisition',
      marketing: 'SEO, SEM, PPC, CPA, CTR, ROI, KPI, Meta Ads',
      sales: 'CRM, B2B, B2C, KPI, ROI, Cold Calling, Pipeline',
      customer_service: 'SLA, CRM, CSAT, NPS, Zendesk, Escalation',
      graphic_designer: 'Adobe, Photoshop, Illustrator, InDesign, Figma, Branding',
      ui_ux_designer: 'Figma, Wireframing, Prototyping, Design System, UI/UX',
      architect: 'AutoCAD, Revit, BIM, 3ds Max, Building Codes, LEED',
      civil_engineer: 'AutoCAD, Civil 3D, STAAD Pro, SAP2000, OSHA, BOQ',
      mechanical_engineer: 'SolidWorks, AutoCAD, ANSYS, HVAC, CAD/CAM',
      electrical_engineer: 'MATLAB, PLC, SCADA, AutoCAD Electrical, PCB Design, IoT',
      data_analyst: 'SQL, Excel, Tableau, Power BI, Python, R, ETL',
      financial_analyst: 'ROI, DCF, NPV, EBITDA, Financial Modeling, Valuation, Excel',
      executive_assistant: 'ERP, CRM, Microsoft Office, Scheduling, Minutes',
      project_manager: 'PMP, Agile, Scrum, Kanban, Jira, KPI, SDLC'
    };
    if (professionAcronyms[field]) {
      nudges.push({ type: 'hint', section: 'skills', msg: `💡 اختصارات ومتطلبات شائعة في مجالك (${field}): [ ${professionAcronyms[field]} ] — تأكد من إدراج ما تتقنه منها.`, action: 'edit-skills' });
    }
    
    // Project suggestions
    if (!(career.projects || []).length) {
      if (['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'architect', 'civil_engineer', 'mechanical_engineer', 'electrical_engineer', 'data_analyst'].includes(field)) {
        nudges.push({ type: 'warning', section: 'projects', msg: 'Add at least one project to showcase your practical skills.', action: 'edit-projects' });
      }
    } else if (['developer', 'designer', 'graphic_designer', 'ui_ux_designer'].includes(field)) {
      const hasLinks = (career.projects || []).some(p => p.links && (p.links.googlePlay || p.links.appStore || p.links.ios || p.links.github || p.links.website || p.url));
      if (!hasLinks) {
        nudges.push({ type: 'tip', section: 'projects', msg: '💡 أضف روابط لتطبيقاتك (Google Play / App Store / GitHub / Demo) داخل قسم المشاريع لإثبات جودة عملك.', action: 'edit-projects' });
      }
    }

    if (['safety', 'safety_officer', 'quality', 'project_manager', 'doctor', 'nurse', 'pharmacist'].includes(field) && (career.education || []).length > 0) {
      const hasCertLinks = (career.education || []).some(e => e.url || e.certUrl || e.link || e.verificationUrl);
      if (!hasCertLinks) {
        nudges.push({ type: 'tip', section: 'education', msg: '💡 يمكنك إضافة روابط التحقق من شهاداتك المهنية (مثل OSHA / NEBOSH / PMP) في قسم الشهادات والتعليم لزيادة المصداقية.', action: 'edit-education' });
      }
    }
    
    // Skills suggestions
    const skillCount = Object.values(career.skills || {}).flat().length;
    if (skillCount < 5) {
      nudges.push({ type: 'warning', section: 'skills', msg: 'Add more skills to pass ATS filters and show your expertise.', action: 'edit-skills' });
    }
    
    // Education suggestions
    if (!(career.education || []).length && (level !== 'fresh' || ['doctor', 'nurse', 'pharmacist', 'dentist', 'accountant', 'teacher', 'lawyer', 'architect', 'civil_engineer', 'mechanical_engineer', 'electrical_engineer', 'financial_analyst'].includes(field))) {
      nudges.push({ type: 'info', section: 'education', msg: 'Education helps establish your qualifications. Add your degrees.', action: 'edit-education' });
    }
    
    return nudges;
  }

  function getCrossSectionHints(career) {
    const hints = [];
    const skillFlat = Object.values(career.skills || {}).flat().map(s => s.toLowerCase());
    const projectText = (career.projects || []).map(p => [p.tech, ...(p.bullets || [])].join(' ')).join(' ').toLowerCase();
    const expText = (career.experience || []).map(e => [e.role, e.company, ...(e.bullets || [])].join(' ')).join(' ').toLowerCase();
    const field = career.careerProfile?.field || 'other';

    // Profession-specific keyword detection
    const professionKeywords = {
      developer: ['rest api', 'firebase', 'bloc', 'socket', 'google maps', 'sqlite', 'react', 'angular', 'vue', 'node', 'python', 'java', 'javascript', 'typescript', 'git', 'docker', 'ci/cd', 'sql', 'aws'],
      designer: ['figma', 'sketch', 'adobe', 'photoshop', 'illustrator', 'ui', 'ux', 'wireframe', 'prototype', 'design system', 'indesign', 'branding'],
      graphic_designer: ['photoshop', 'illustrator', 'indesign', 'adobe', 'branding', 'typography', 'layout', 'color theory', 'print design'],
      ui_ux_designer: ['figma', 'wireframing', 'prototyping', 'usability testing', 'design system', 'user research', 'ui', 'ux', 'adobe xd'],
      marketer: ['seo', 'sem', 'ppc', 'social media', 'content marketing', 'email marketing', 'analytics', 'google ads', 'facebook ads', 'cpa', 'ctr', 'roi', 'kpi'],
      marketing: ['seo', 'sem', 'ppc', 'social media', 'content marketing', 'email marketing', 'analytics', 'google ads', 'facebook ads', 'cpa', 'ctr', 'roi', 'kpi'],
      sales: ['crm', 'b2b', 'b2c', 'kpi', 'roi', 'cold calling', 'pipeline', 'lead generation', 'negotiation', 'closing'],
      customer_service: ['sla', 'crm', 'csat', 'nps', 'ticket management', 'zendesk', 'escalation', 'communication', 'retention'],
      data_scientist: ['python', 'machine learning', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy', 'sql', 'data visualization', 'r'],
      data_analyst: ['sql', 'excel', 'tableau', 'power bi', 'python', 'r', 'data cleaning', 'etl', 'data visualization', 'statistics'],
      financial_analyst: ['roi', 'dcf', 'npv', 'ebitda', 'financial modeling', 'valuation', 'forecast', 'excel', 'financial analysis'],
      project_manager: ['agile', 'scrum', 'kanban', 'jira', 'stakeholder', 'milestone', 'risk management', 'budget', 'pmp', 'sdlc', 'kpi'],
      doctor: ['patient care', 'diagnosis', 'treatment planning', 'medical records', 'clinical examination', 'patient communication', 'emr', 'ekg', 'cpr', 'icu', 'er'],
      dentist: ['dds', 'dmd', 'rct', 'cad/cam', 'cbct', 'patient counseling', 'dental surgery', 'orthodontics', 'periodontics', 'emr'],
      nurse: ['patient monitoring', 'vital signs', 'care planning', 'medication administration', 'rn', 'bls', 'acls', 'icu', 'emr', 'iv', 'triage', 'cpr'],
      pharmacist: ['medication review', 'patient counseling', 'drug interactions', 'clinical pharmacy', 'otc', 'fda', 'gmp', 'sop', 'emr'],
      teacher: ['lms', 'esl', 'stem', 'iep', 'tesol', 'curriculum development', 'classroom management', 'lesson planning', 'student assessment'],
      accountant: ['gaap', 'ifrs', 'vat', 'p&l', 'erp', 'cpa', 'cma', 'roi', 'excel', 'bookkeeping', 'audit', 'tax compliance'],
      lawyer: ['llb', 'llm', 'contract negotiation', 'legal research', 'arbitration', 'compliance', 'intellectual property', 'litigation'],
      hr: ['kpi', 'ats', 'hris', 'roi', 'osha', 'payroll', 'talent acquisition', 'onboarding', 'employee relations', 'performance management'],
      architect: ['autocad', 'revit', 'bim', '3ds max', 'sketchup', 'building codes', 'leed', 'architectural design', 'urban planning'],
      civil_engineer: ['autocad', 'civil 3d', 'staad pro', 'sap2000', 'structural analysis', 'osha', 'boq', 'project management', 'site supervision'],
      mechanical_engineer: ['solidworks', 'autocad', 'ansys', 'hvac', 'thermodynamics', 'cad/cam', 'fluid mechanics', 'maintenance'],
      electrical_engineer: ['matlab', 'plc', 'scada', 'autocad electrical', 'pcb design', 'high voltage', 'iot', 'power systems', 'circuit design'],
      executive_assistant: ['erp', 'crm', 'microsoft office', 'travel arrangements', 'meeting minutes', 'scheduling', 'calendar management', 'communication'],
      other: ['communication', 'problem solving', 'teamwork', 'planning', 'leadership', 'organization', 'time management']
    };
    
    const keywords = professionKeywords[field] || professionKeywords.other;
    
    keywords.forEach(kw => {
      const kwNormalized = kw.replace(' ', '').toLowerCase();
      if (projectText.includes(kwNormalized) || projectText.includes(kw.toLowerCase()) || expText.includes(kwNormalized) || expText.includes(kw.toLowerCase())) {
        const hasSkill = skillFlat.some(s => s.includes(kw.split(' ')[0].toLowerCase()));
        if (!hasSkill) {
          hints.push({ type: 'hint', msg: `"${kw}" appears in your experience/projects but not in Skills — consider adding it.`, action: 'edit-skills' });
        }
      }
    });

    // Summary length optimization
    const summaryLen = (career.professionalSummary || '').length;
    if (summaryLen > 600) {
      hints.push({ type: 'warning', msg: 'Your CV summary is long — consider shortening for ATS optimization.', action: 'edit-summary' });
    } else if (summaryLen < 100 && summaryLen > 0) {
      hints.push({ type: 'info', msg: 'Consider expanding your summary to include more achievements.', action: 'edit-summary' });
    }

    // Project count optimization
    const projectCount = (career.projects || []).length;
    if (projectCount > 8) {
      hints.push({ type: 'warning', msg: 'CV may exceed one page — consider showing top 5-6 projects.', action: 'edit-projects' });
    }

    // Experience bullet quality check
    (career.experience || []).forEach((exp, idx) => {
      if (exp.bullets && exp.bullets.length < 2) {
        hints.push({ type: 'info', msg: `Add more bullet points to "${exp.role}" to highlight achievements.`, action: 'edit-experience' });
      }
    });

    // ATS compatibility check
    const hasEmail = career.personalInfo?.email?.includes('@');
    const hasPhone = career.personalInfo?.phone?.length > 5;
    if (!hasEmail || !hasPhone) {
      hints.push({ type: 'warning', msg: 'Add email and phone for ATS compatibility and recruiter contact.', action: 'edit-personal' });
    }

    return hints;
  }

  function getAIActionSuggestions(career) {
    const suggestions = [];
    const field = career.careerProfile?.field || 'other';
    const ar = career.meta?.locale === 'ar' || (typeof I18n !== 'undefined' && I18n.getLocale && I18n.getLocale() === 'ar');
    const copy = (en, arText) => ar ? arText : en;
    const fieldNames = {
      developer: ['developer', 'البرمجة'],
      doctor: ['doctor', 'الطب'],
      dentist: ['dentist', 'طب الأسنان'],
      nurse: ['nurse', 'التمريض'],
      pharmacist: ['pharmacist', 'الصيدلة'],
      teacher: ['teacher', 'التعليم'],
      accountant: ['accountant', 'المحاسبة'],
      designer: ['designer', 'التصميم'],
      graphic_designer: ['graphic designer', 'التصميم الجرافيكي'],
      ui_ux_designer: ['UI/UX designer', 'تصميم واجهات وتجربة المستخدم'],
      marketing: ['marketing', 'التسويق'],
      sales: ['sales', 'المبيعات'],
      customer_service: ['customer service', 'خدمة العملاء'],
      lawyer: ['lawyer', 'القانون'],
      hr: ['human resources', 'الموارد البشرية'],
      architect: ['architect', 'الهندسة المعمارية'],
      civil_engineer: ['civil engineer', 'الهندسة المدنية'],
      mechanical_engineer: ['mechanical engineer', 'الهندسة الميكانيكية'],
      electrical_engineer: ['electrical engineer', 'الهندسة الكهربائية'],
      data_analyst: ['data analyst', 'تحليل البيانات'],
      financial_analyst: ['financial analyst', 'التحليل المالي'],
      executive_assistant: ['executive assistant', 'السكرتارية والإدارة'],
      project_manager: ['project manager', 'إدارة المشاريع']
    };
    const fieldLabel = (fieldNames[field] || [field, field])[ar ? 1 : 0];
    const summary = String(career.professionalSummary || '').trim();
    const summaryWords = summary.split(/\s+/).filter(Boolean).length;
    const skillCount = Object.values(career.skills || {}).flat().length;
    const expCount = (career.experience || []).length;
    const hasEducation = (career.education || []).length > 0;

    suggestions.push({
      icon: '✨',
      title: copy(summary ? 'Regenerate Summary' : 'Generate Summary', summary ? 'إنشاء نبذة جديدة' : 'إنشاء نبذة'),
      description: copy('Write a strong opening summary from the CV data', 'اكتب نبذة افتتاحية قوية من بيانات السيرة'),
      action: 'generate-summary'
    });

    suggestions.push({
      icon: '📝',
      title: copy('Improve Summary', 'تحسين النبذة'),
      description: copy('Make the summary clearer and more convincing', 'خلي النبذة أوضح وأقوى'),
      action: 'improve-summary'
    });

    suggestions.push({
      icon: '✂',
      title: copy('Shorten Summary', 'اختصار النبذة'),
      description: copy(summaryWords > 55 ? 'Make it tighter and easier to scan' : 'Create a tighter version when the wording feels heavy', summaryWords > 55 ? 'اختصرها عشان تتقري بسرعة' : 'اعمل نسخة أخف لو الكلام تقيل'),
      action: 'shorten-summary'
    });

    suggestions.push({
      icon: '🌐',
      title: copy('Translate Summary', 'ترجمة النبذة'),
      description: copy('Translate without adding fake details', 'ترجمة من غير إضافة معلومات غير حقيقية'),
      action: 'translate-summary'
    });

    suggestions.push({
      icon: '💡',
      title: copy('Suggest Skills', 'اقتراح مهارات'),
      description: copy(`Suggest relevant skills for ${fieldLabel}`, `اقتراح مهارات مناسبة لمجال ${fieldLabel}`),
      action: 'suggest-skills'
    });

    suggestions.push({
      icon: '🧹',
      title: copy(skillCount > 12 ? 'Trim Skills' : 'Organize Skills', skillCount > 12 ? 'تنضيف المهارات' : 'ترتيب المهارات'),
      description: copy(skillCount > 12 ? 'Keep the strongest skills only' : 'Review categories and remove weak wording', skillCount > 12 ? 'خلي المهارات المهمة بس' : 'راجع التصنيفات وشيل الكلام الضعيف'),
      action: 'edit-skills'
    });

    if (expCount > 0) {
      suggestions.push({
        icon: '🎯',
        title: copy('Improve Experience', 'تحسين الخبرة'),
        description: copy('Turn duties into stronger achievement bullets', 'حوّل المسؤوليات لنقاط إنجاز أقوى'),
        action: 'improve-bullets'
      });
    } else {
      suggestions.push({
        icon: '💼',
        title: copy('Add Experience', 'إضافة خبرة'),
        description: copy('Add a job, training, internship, or practical role', 'أضف وظيفة أو تدريب أو خبرة عملية'),
        action: 'edit-experience'
      });
    }

    if (!hasEducation && ['doctor', 'dentist', 'nurse', 'pharmacist', 'accountant', 'teacher', 'lawyer', 'architect', 'civil_engineer', 'mechanical_engineer', 'electrical_engineer', 'financial_analyst'].includes(field)) {
      suggestions.push({
        icon: '🎓',
        title: copy('Add Education', 'إضافة التعليم'),
        description: copy('Education is important for this profession', 'التعليم مهم جدًا في المجال ده'),
        action: 'edit-education'
      });
    }

    suggestions.push({
      icon: '📊',
      title: copy('ATS Check', 'فحص ATS'),
      description: copy('Review the CV before export', 'مراجعة السيرة قبل التصدير'),
      action: 'ats-check'
    });

    return suggestions.slice(0, 8);
  }
  function getAll(career) {
    return [...getMissingDataNudges(career), ...getCrossSectionHints(career)];
  }

  return { 
    getMissingDataNudges, 
    getCrossSectionHints, 
    getAll,
    getAIActionSuggestions
  };
})();

if (typeof module !== 'undefined') module.exports = Suggestions;


