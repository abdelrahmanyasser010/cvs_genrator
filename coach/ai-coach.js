/**
 * CV Studio AI Coach
 * Rule-based, offline-first guidance that behaves like a product coach.
 */
const AICoach = (function () {
  const FIELD_LABELS = {
    developer: { en: 'software', ar: 'البرمجة' },
    designer: { en: 'design', ar: 'التصميم' },
    graphic_designer: { en: 'design', ar: 'التصميم' },
    ui_ux_designer: { en: 'product design', ar: 'تصميم تجربة المستخدم' },
    marketing: { en: 'marketing', ar: 'التسويق' },
    accountant: { en: 'finance', ar: 'المحاسبة' },
    teacher: { en: 'education', ar: 'التعليم' },
    doctor: { en: 'healthcare', ar: 'الطب' },
    nurse: { en: 'healthcare', ar: 'التمريض' },
    pharmacist: { en: 'healthcare', ar: 'الصيدلة' },
    lawyer: { en: 'legal', ar: 'القانون' },
    hr: { en: 'people operations', ar: 'الموارد البشرية' },
    sales: { en: 'sales', ar: 'المبيعات' },
    data_analyst: { en: 'data', ar: 'تحليل البيانات' },
    project_manager: { en: 'project delivery', ar: 'إدارة المشاريع' },
    business_analyst: { en: 'business analysis', ar: 'تحليل الأعمال' },
    other: { en: 'your field', ar: 'مجالك' }
  };

  const FIELD_SKILLS = {
    developer: ['JavaScript', 'REST APIs', 'Git', 'Problem Solving', 'Clean Architecture', 'Testing'],
    designer: ['Figma', 'Brand Identity', 'Visual Design', 'Typography', 'Prototyping'],
    graphic_designer: ['Adobe Photoshop', 'Adobe Illustrator', 'Brand Identity', 'Print Design', 'Typography'],
    ui_ux_designer: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
    marketing: ['SEO', 'Content Strategy', 'Google Ads', 'Analytics', 'Social Media'],
    accountant: ['Excel', 'Financial Reporting', 'ERP Systems', 'Tax', 'Reconciliation'],
    teacher: ['Lesson Planning', 'Classroom Management', 'Student Assessment', 'Curriculum Design'],
    doctor: ['Patient Care', 'Diagnosis', 'Treatment Planning', 'Medical Records', 'Patient Communication', 'Clinical Examination'],
    nurse: ['Patient Monitoring', 'Medication Administration', 'Vital Signs', 'Care Planning', 'Emergency Response'],
    pharmacist: ['Medication Review', 'Patient Counseling', 'Drug Interactions', 'Inventory Control', 'Clinical Pharmacy'],
    sales: ['Lead Generation', 'CRM', 'Negotiation', 'Pipeline Management', 'Client Relationships'],
    hr: ['Recruitment', 'Onboarding', 'Employee Relations', 'HR Policies', 'Performance Management'],
    data_analyst: ['SQL', 'Excel', 'Power BI', 'Data Cleaning', 'Dashboarding'],
    project_manager: ['Agile', 'Scrum', 'Stakeholder Management', 'Risk Management', 'Jira'],
    other: ['Communication', 'Problem Solving', 'Teamwork', 'Planning', 'Attention to Detail']
  };

  const FIELD_SKILLS_AR = {
    developer: ['حل المشكلات', 'Git', 'واجهات برمجة التطبيقات', 'اختبار البرمجيات', 'تنظيم الكود', 'قواعد البيانات'],
    designer: ['Figma', 'الهوية البصرية', 'تصميم الواجهات', 'الطباعة', 'النماذج التفاعلية'],
    graphic_designer: ['Adobe Photoshop', 'Adobe Illustrator', 'الهوية البصرية', 'تصميم المطبوعات', 'الطباعة'],
    ui_ux_designer: ['Figma', 'بحث المستخدمين', 'تصميم النماذج الأولية', 'اختبار قابلية الاستخدام', 'أنظمة التصميم'],
    marketing: ['تحسين محركات البحث', 'استراتيجية المحتوى', 'إعلانات Google', 'تحليل الأداء', 'إدارة السوشيال ميديا'],
    accountant: ['Excel', 'التقارير المالية', 'أنظمة ERP', 'الضرائب', 'التسويات البنكية'],
    teacher: ['تخطيط الدروس', 'إدارة الفصل', 'تقييم الطلاب', 'تصميم المناهج', 'التواصل مع أولياء الأمور'],
    doctor: ['رعاية المرضى', 'التشخيص', 'وضع خطط العلاج', 'السجلات الطبية', 'التواصل مع المرضى', 'الفحص السريري'],
    nurse: ['متابعة المرضى', 'قياس العلامات الحيوية', 'إدارة الأدوية', 'خطط الرعاية', 'الاستجابة للطوارئ'],
    pharmacist: ['مراجعة الأدوية', 'إرشاد المرضى', 'التداخلات الدوائية', 'إدارة المخزون', 'الصيدلة السريرية'],
    sales: ['إدارة العملاء', 'التفاوض', 'إدارة خط المبيعات', 'CRM', 'بناء العلاقات'],
    hr: ['التوظيف', 'تهيئة الموظفين', 'علاقات الموظفين', 'سياسات الموارد البشرية', 'إدارة الأداء'],
    data_analyst: ['SQL', 'Excel', 'Power BI', 'تنظيف البيانات', 'لوحات المعلومات'],
    project_manager: ['Agile', 'Scrum', 'إدارة أصحاب المصلحة', 'إدارة المخاطر', 'Jira'],
    other: ['التواصل', 'حل المشكلات', 'العمل الجماعي', 'التخطيط', 'الاهتمام بالتفاصيل']
  };

  const ACTION_VERBS = ['Built', 'Improved', 'Managed', 'Delivered', 'Designed', 'Implemented', 'Optimized', 'Led'];

  function field(career) {
    return career?.careerProfile?.field || 'other';
  }

  function level(career) {
    return career?.careerProfile?.level || 'junior';
  }

  function locale(career) {
    return career?.meta?.locale || (typeof I18n !== 'undefined' ? I18n.getLocale() : 'en') || 'en';
  }

  function isArabic(career) {
    return locale(career) === 'ar';
  }

  function tr(career, en, ar) {
    return isArabic(career) ? ar : en;
  }

  function industry(career) {
    const label = FIELD_LABELS[field(career)] || FIELD_LABELS.other;
    return isArabic(career) ? label.ar : label.en;
  }

  function flatSkills(career) {
    return Object.values(career?.skills || {}).flat().filter(Boolean);
  }

  function suggestSkills(career, currentSkills = flatSkills(career)) {
    const pool = (isArabic(career) ? FIELD_SKILLS_AR[field(career)] : FIELD_SKILLS[field(career)])
      || (isArabic(career) ? FIELD_SKILLS_AR.other : FIELD_SKILLS.other);
    const current = currentSkills.map(skill => String(skill).toLowerCase());
    return pool.filter(skill => !current.includes(String(skill).toLowerCase()));
  }

  function wordCount(text) {
    return String(text || '').trim().split(/\s+/).filter(Boolean).length;
  }

  function hasMetric(text) {
    return /\d|%|\b(kpi|revenue|cost|users|students|clients|sales|time|hours|days|growth)\b/i.test(text || '');
  }

  function getWizardGuidance(career, step) {
    const area = industry(career);
    const fresh = level(career) === 'fresh';
    const guides = {
      welcome: {
        title: tr(career, 'I will keep the CV focused, not noisy.', 'هخلي السيرة مركزة وقوية من غير حشو.'),
        body: tr(career, 'Answer naturally. I will turn rough answers into recruiter-friendly content later.', 'جاوب بطبيعتك، وأنا هحوّل الإجابات الخام لصياغة مناسبة للـ CV بعدين.')
      },
      field: {
        title: tr(career, 'Pick the closest profession.', 'اختار أقرب مجال لشغلك.'),
        body: tr(career, 'This controls the questions, skills, summary, and template recommendation.', 'ده هيحدد الأسئلة والمهارات والملخص وترشيح القالب.')
      },
      experience_years: {
        title: tr(career, 'This changes the CV strategy.', 'ده بيغير استراتيجية الـ CV.'),
        body: tr(career, 'Fresh CVs should emphasize education/projects. Senior CVs should emphasize impact and leadership.', 'لو حديث تخرج نركز على التعليم والمشاريع. لو senior نركز على التأثير والقيادة.')
      },
      education: {
        title: tr(career, fresh ? 'Education matters a lot for your level.' : 'Keep education concise.', fresh ? 'التعليم مهم جدًا في مستواك.' : 'خلي التعليم مختصر.'),
        body: tr(career, 'Use: Degree, institution, year. Example: BSc Accounting, Cairo University, 2024.', 'اكتب: الدرجة، الجامعة، السنة. مثال: بكالوريوس تجارة، جامعة القاهرة، 2024.')
      },
      experience: {
        title: tr(career, fresh ? 'Internships and training count.' : 'Write the role first, details later.', fresh ? 'التدريب والمشاريع العملية يتحسبوا.' : 'اكتب المسمى الوظيفي الأول، والتفاصيل بعدين.'),
        body: tr(career, `For ${area}, strong bullets should show action plus result.`, `في مجال ${area}، الجملة القوية لازم تبين فعل ونتيجة.`)
      },
      projects: {
        title: tr(career, 'A project can rescue a thin CV.', 'المشروع القوي ممكن يرفع CV ضعيف.'),
        body: tr(career, 'Mention what you built, who it helped, and the tools used.', 'اكتب بنيت إيه، فاد مين، واستخدمت أدوات إيه.')
      },
      skills: {
        title: tr(career, 'Aim for focused skills, not a long list.', 'استهدف مهارات مركزة، مش قائمة طويلة.'),
        body: tr(career, `For ${area}, 8-12 relevant skills is usually enough.`, `في مجال ${area}، من 8 إلى 12 مهارة مناسبة غالبًا كفاية.`)
      },
      template: {
        title: tr(career, 'ATS first, beauty second.', 'الـ ATS أولًا، الشكل ثانيًا.'),
        body: tr(career, 'Choose AI Recommended unless you have a clear visual preference.', 'اختار الترشيح الذكي إلا لو عندك تفضيل بصري واضح.')
      },
      done: {
        title: tr(career, 'Next step: review before export.', 'الخطوة الجاية: مراجعة قبل التصدير.'),
        body: tr(career, 'The editor will show weak sections and quick fixes before downloading.', 'المحرر هيعرض الأقسام الضعيفة وإصلاحات سريعة قبل التحميل.')
      }
    };
    return guides[step] || {
      title: tr(career, 'Small detail, big difference.', 'تفصيلة صغيرة بتفرق.'),
      body: tr(career, 'Clear, specific answers produce a stronger CV.', 'الإجابات الواضحة والمحددة بتطلع CV أقوى.')
    };
  }

  function analyzeWizardInput(career, step, value) {
    const text = String(value || '').trim();
    if (!text) return null;
    if (step === 'email' && !/^[^s@]+@[^s@]+.[^s@]+$/.test(text)) {
      return { tone: 'warn', message: tr(career, 'This email may fail recruiter systems.', 'الإيميل ده ممكن مايتقبلش في أنظمة التوظيف.') };
    }
    if ((step === 'experience' || step === 'projects') && wordCount(text) < 4) {
      return { tone: 'warn', message: tr(career, 'Give me a little more context so I can turn it into a strong bullet later.', 'اديني تفاصيل أكتر شوية عشان أقدر أحولها لجملة قوية بعدين.') };
    }
    if (step === 'skills' && text.split(',').filter(Boolean).length < 3) {
      return { tone: 'warn', message: tr(career, 'Add at least 3 skills separated by commas.', 'ضيف 3 مهارات على الأقل وافصل بينهم بفواصل.') };
    }
    return { tone: 'good', message: tr(career, 'Good. This is usable for the CV.', 'تمام. ده قابل للاستخدام في الـ CV.') };
  }

  function getSectionAdvice(career, section) {
    const review = getPreExportReview(career);
    const related = review.items.filter(item => item.section === section).slice(0, 3);
    if (related.length) return related;
    return [{
      id: `section-${section}-ok`,
      severity: 'good',
      section,
      title: tr(career, 'This section is in decent shape.', 'القسم ده حالته كويسة.'),
      detail: tr(career, 'Keep it specific, concise, and aligned with the job you want.', 'خليه محدد ومختصر ومناسب للوظيفة اللي مستهدفها.')
    }];
  }

  function getPreExportReview(career) {
    const items = [];
    const p = career.personalInfo || {};
    const links = p.links || {};
    const skills = flatSkills(career);
    const exp = career.experience || [];
    const projects = career.projects || [];
    const summary = career.professionalSummary || '';
    const currentField = field(career);

    if (!p.name?.trim()) items.push(issue(career, 'missing-name', 'blocker', 'personalInfo', 'Add your full name.', 'Recruiters need a clear name at the top of the CV.', 'Add name'));
    if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(p.email || '')) items.push(issue(career, 'bad-email', 'blocker', 'personalInfo', 'Add a valid email.', 'ATS and recruiters may reject or miss invalid contact details.', 'Fix contact'));
    if (!p.phone?.trim()) items.push(issue(career, 'missing-phone', 'warn', 'personalInfo', 'Add a phone number.', 'A CV should give recruiters more than one contact method.', 'Fix contact'));
    if (currentField === 'developer' && !links.github?.trim()) items.push(issue(career, 'missing-github', 'tip', 'personalInfo', 'Add GitHub or portfolio.', 'For developer roles, proof of work increases trust.', 'Open contact'));

    if (!summary.trim()) {
      items.push(issue(career, 'missing-summary', 'blocker', 'summary', 'Generate a professional summary.', 'A short summary gives the CV direction and improves keyword matching.', 'Generate'));
    } else if (wordCount(summary) < 18) {
      items.push(issue(career, 'short-summary', 'warn', 'summary', 'Strengthen your summary.', 'It is too short to explain your value clearly.', 'Improve'));
    } else if (wordCount(summary) > 95) {
      items.push(issue(career, 'long-summary', 'warn', 'summary', 'Shorten your summary.', 'Long summaries are harder to scan and can waste first-page space.', 'Shorten'));
    }

    if (!exp.length && level(career) !== 'fresh') {
      items.push(issue(career, 'missing-experience', 'blocker', 'experience', 'Add work experience.', 'A non-fresh CV without experience will feel incomplete.', 'Add role'));
    }
    exp.forEach((entry, index) => {
      const bullets = entry.bullets || [];
      if (!bullets.length && entry.role) items.push(issue(career, `empty-exp-${index}`, 'warn', 'experience', `Add bullets for ${entry.role}.`, 'Describe responsibilities and impact, not just the job title.', 'Open experience'));
      bullets.forEach((bullet, bulletIndex) => {
        if (wordCount(bullet) < 6) items.push(issue(career, `thin-bullet-${index}-${bulletIndex}`, 'warn', 'experience', 'Improve a thin experience bullet.', 'Short bullets often look like tasks, not achievements.', 'Improve bullets'));
        if (!hasMetric(bullet)) items.push(issue(career, `metric-bullet-${index}-${bulletIndex}`, 'tip', 'experience', 'Add measurable impact where possible.', 'Numbers make achievements more credible.', 'Open experience'));
      });
    });

    if (!projects.length && ['developer', 'designer', 'graphic_designer', 'ui_ux_designer', 'architect', 'civil_engineer', 'mechanical_engineer', 'electrical_engineer', 'data_analyst'].includes(currentField)) {
      items.push(issue(career, 'missing-project', 'warn', 'projects', 'Add one strong project.', 'Projects show proof of skill, especially for practical roles.', 'Add project'));
    }

    if (skills.length < 6) items.push(issue(career, 'few-skills', 'warn', 'skills', 'Add more relevant skills.', 'ATS scanners need enough field keywords to match the role.', 'Suggest skills'));
    if (skills.length > 16) items.push(issue(career, 'many-skills', 'tip', 'skills', 'Trim the skills list.', 'A focused skills list looks more credible than a long generic list.', 'Open skills'));

    if (!(career.education || []).length && (level(career) === 'fresh' || ['doctor', 'dentist', 'nurse', 'pharmacist', 'accountant', 'teacher', 'lawyer', 'architect', 'civil_engineer', 'mechanical_engineer', 'electrical_engineer', 'financial_analyst'].includes(currentField))) {
      items.push(issue(career, 'fresh-education', 'warn', 'education', 'Add education for this CV.', 'Education is a core proof point for this profession.', 'Add education'));
    }

    const blockers = items.filter(item => item.severity === 'blocker').length;
    const warnings = items.filter(item => item.severity === 'warn').length;
    let score = Math.max(0, 100 - blockers * 24 - warnings * 11 - items.filter(item => item.severity === 'tip').length * 4);
    const meaningfulExperience = exp.some(entry => entry.role?.trim() && entry.company?.trim() && (entry.bullets || []).length >= 2);
    const meaningfulSummary = wordCount(summary) >= 18;
    const validContact = /^[^s@]+@[^s@]+.[^s@]+$/.test(p.email || '') && p.phone?.trim();
    if (blockers) score = Math.min(score, 68);
    if (!meaningfulSummary) score = Math.min(score, 78);
    if (!meaningfulExperience && level(career) !== 'fresh') score = Math.min(score, 64);
    if (!validContact) score = Math.min(score, 70);
    if (skills.length < 6) score = Math.min(score, 76);
    if (warnings >= 3) score = Math.min(score, 72);
    return { score, blockers, warnings, items };
  }

  function localizedIssue(career, id, title, detail, actionLabel) {
    if (!isArabic(career)) return { title, detail, actionLabel };
    const staticCopy = {
      'missing-name': ['أضف اسمك الكامل.', 'لازم يكون الاسم واضح في أعلى السيرة الذاتية.', 'أضف الاسم'],
      'bad-email': ['أضف بريد إلكتروني صحيح.', 'الإيميل الخاطئ ممكن يمنع وصول مسؤول التوظيف لك.', 'صحح التواصل'],
      'missing-phone': ['أضف رقم الهاتف.', 'السيرة الذاتية الأفضل توفر أكثر من طريقة للتواصل.', 'صحح التواصل'],
      'missing-github': ['أضف GitHub أو Portfolio.', 'ده مهم أكثر لو المجال برمجة أو تصميم.', 'افتح بيانات التواصل'],
      'missing-summary': ['أنشئ نبذة مهنية.', 'النبذة القصيرة بتدي اتجاه للسيرة وتحسن مطابقة الكلمات المفتاحية.', 'أنشئ'],
      'short-summary': ['قوّي النبذة المهنية.', 'النبذة الحالية قصيرة ومش بتشرح قيمتك بوضوح.', 'حسّن'],
      'long-summary': ['اختصر النبذة المهنية.', 'النبذة الطويلة بتصعب القراءة وبتاخد مساحة مهمة.', 'اختصر'],
      'missing-experience': ['أضف الخبرات العملية.', 'السيرة بدون خبرة عملية واضحة هتظهر ناقصة.', 'أضف خبرة'],
      'missing-project': ['أضف مشروع قوي.', 'المشاريع بتثبت المهارات العملية خصوصًا في المجالات التطبيقية.', 'أضف مشروع'],
      'few-skills': ['أضف مهارات مناسبة أكثر.', 'أنظمة ATS تحتاج كلمات مفتاحية كفاية مرتبطة بالمجال.', 'اقترح مهارات'],
      'many-skills': ['اختصر قائمة المهارات.', 'القائمة المركزة أصدق من قائمة طويلة وعامة.', 'افتح المهارات'],
      'fresh-education': ['أضف التعليم والمؤهل.', 'التعليم دليل أساسي في هذا المجال.', 'أضف التعليم']
    };
    if (staticCopy[id]) {
      const [arTitle, arDetail, arAction] = staticCopy[id];
      return { title: arTitle, detail: arDetail, actionLabel: arAction };
    }
    if (id.startsWith('empty-exp')) return { title: 'أضف نقاط للخبرة.', detail: 'اكتب المسؤوليات والنتائج، مش المسمى الوظيفي فقط.', actionLabel: 'افتح الخبرة' };
    if (id.startsWith('thin-bullet')) return { title: 'حسّن نقطة خبرة ضعيفة.', detail: 'الجمل القصيرة جدًا بتظهر كمهام، مش إنجازات.', actionLabel: 'حسّن النقاط' };
    if (id.startsWith('metric-bullet')) return { title: 'أضف أثر قابل للقياس لو متاح.', detail: 'الأرقام والنتائج بتخلي الإنجاز أكثر إقناعًا.', actionLabel: 'افتح الخبرة' };
    return { title, detail, actionLabel };
  }

  function issue(career, id, severity, section, title, detail, actionLabel) {
    const copy = localizedIssue(career, id, title, detail, actionLabel);
    return { id, severity, section, title: copy.title, detail: copy.detail, actionLabel: copy.actionLabel };
  }

  async function applyQuickFix(career, issueId) {
    const currentField = field(career);
    if (issueId === 'missing-summary' || issueId === 'short-summary') {
      let picked = null;
      if (typeof ContentPicker !== 'undefined') {
        try { picked = await ContentPicker.getSummary(career); } catch { picked = null; }
      }
      career.professionalSummary = picked?.text || buildFallbackSummary(career);
      return { section: 'summary', message: tr(career, 'Summary generated.', 'تم إنشاء الملخص.') };
    }

    if (issueId === 'long-summary') {
      career.professionalSummary = String(career.professionalSummary || '').split(/\s+/).slice(0, 55).join(' ');
      return { section: 'summary', message: tr(career, 'Summary shortened.', 'تم اختصار الملخص.') };
    }

    if (issueId === 'few-skills') {
      const suggestions = suggestSkills(career);
      const existing = flatSkills(career);
      const category = isArabic(career) ? 'المهارات الأساسية' : 'Core Skills';
      career.skills = { [category]: [...new Set([...existing, ...suggestions])].slice(0, 12) };
      return { section: 'skills', message: tr(career, 'Relevant skills added.', 'تمت إضافة مهارات مناسبة.') };
    }

    if (issueId.startsWith('thin-bullet') || issueId.startsWith('metric-bullet')) {
      improveExperienceBullets(career);
      return { section: 'experience', message: tr(career, 'Experience bullets improved.', 'تم تحسين نقاط الخبرة.') };
    }

    return { section: null, message: tr(career, 'Open the section and add the missing detail.', 'افتح القسم وأضف التفاصيل الناقصة.') };
  }

  function buildFallbackSummary(career) {
    const area = industry(career);
    const skills = flatSkills(career).slice(0, 4).join(', ');
    if (isArabic(career)) {
      const suffix = skills ? ` مع مهارات في ${skills}` : ' مع تركيز على الدقة والتواصل المهني';
      return `متخصص في ${area}${suffix}. أعمل على تقديم خدمة موثوقة وتحسين النتائج من خلال تنظيم العمل والاهتمام بالتفاصيل.`;
    }
    const suffix = skills ? ` with strengths in ${skills}` : ' with a practical, results-focused approach';
    return `${titleCase(area)} professional${suffix}. Focused on clear communication, reliable delivery, and continuous improvement across real-world work environments.`;
  }

  function improveExperienceBullets(career) {
    (career.experience || []).forEach(entry => {
      const source = entry.bullets?.length ? entry.bullets : [entry.rawDescription || entry.role].filter(Boolean);
      entry.bullets = source.map((bullet, index) => {
        const text = String(bullet || '').trim();
        if (!text) return '';
        const startsStrong = ACTION_VERBS.some(verb => text.toLowerCase().startsWith(verb.toLowerCase()));
        const verb = ACTION_VERBS[index % ACTION_VERBS.length];
        return startsStrong ? text : `${verb} ${text.charAt(0).toLowerCase()}${text.slice(1)}`;
      }).filter(Boolean);
      entry.rawDescription = entry.bullets.join('\n');
    });
  }

  function titleCase(text) {
    return String(text || '').replace(/\b\w/g, char => char.toUpperCase());
  }

  return {
    getWizardGuidance,
    analyzeWizardInput,
    getSectionAdvice,
    getPreExportReview,
    applyQuickFix,
    suggestSkills,
    improveExperienceBullets,
    buildFallbackSummary
  };
})();

if (typeof module !== 'undefined') module.exports = AICoach;
