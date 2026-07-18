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
      contact: {
        title: tr(career, 'Complete contact info prevents missed calls.', 'بيانات التواصل الكاملة بتضمن إن الفرص متضيعش منك.'),
        body: tr(career, 'Include a professional email, phone number with country code, and city/country.', 'اكتب بريد إلكتروني احترافي، ورقم هاتف مع كود الدولة، والمدينة أو البلد.')
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

    function issue(career, id, severity, section, title, detail, actionLabel, impactPoints = 0) {
    const loc = localizedIssue(career, id, title, detail, actionLabel);
    return { id, severity, section, title: loc.title, detail: loc.detail, actionLabel: loc.actionLabel, impactPoints, why: loc.why, fixAction: loc.fixAction };
  }

  function getPreExportReview(career) {
    const items = [];
    const p = career.personalInfo || {};
    const links = p.links || {};
    const skills = flatSkills(career);
    const exp = career.experience || [];
    const projects = career.projects || [];
    const summary = career.professionalSummary || '';
    
    // Default rules fallback
    const rules = career.meta?.rules || {
      required_sections: ['summary', 'experience', 'skills'],
      recommended_sections: ['education'],
      section_weights: { summary: 20, experience: 40, skills: 20, education: 20 }
    };

    let score = 0;
    
    // 1. Personal Info
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email || '');
    if (!p.name?.trim()) items.push(issue(career, 'missing-name', 'high', 'personalInfo', 'Add your full name.', 'Recruiters need a clear name at the top of the CV.', 'Add name'));
    if (!validEmail) items.push(issue(career, 'bad-email', 'high', 'personalInfo', 'Add a valid email.', 'ATS and recruiters may reject or miss invalid contact details.', 'Fix contact'));
    if (!p.phone?.trim()) items.push(issue(career, 'missing-phone', 'medium', 'personalInfo', 'Add a phone number.', 'A CV should give recruiters more than one contact method.', 'Fix contact'));

    // Summary
    const hasSummary = summary.trim().length > 0;
    const meaningfulSummary = wordCount(summary) >= 18;
    const wSum = rules.section_weights.summary || 0;
    if (hasSummary && meaningfulSummary) {
      score += wSum;
    } else if (hasSummary) {
      score += wSum / 2;
      items.push(issue(career, 'short-summary', 'medium', 'summary', 'Strengthen your summary.', 'It is too short to explain your value clearly.', 'Improve', wSum / 2));
    } else if (rules.required_sections.includes('summary')) {
      items.push(issue(career, 'missing-summary', 'high', 'summary', 'Generate a professional summary.', 'A short summary gives the CV direction and improves keyword matching.', 'Generate', wSum));
    }

    // Experience
    const hasExperience = exp.length > 0;
    const meaningfulExperience = exp.some(entry => entry.role?.trim() && entry.company?.trim() && (entry.bullets || []).length >= 2);
    const wExp = rules.section_weights.experience || 0;
    if (hasExperience && meaningfulExperience) {
      score += wExp;
      exp.forEach((entry, index) => {
        const bullets = entry.bullets || [];
        if (!bullets.length && entry.role) items.push(issue(career, `empty-exp-${index}`, 'low', 'experience', `Add bullets for ${entry.role}.`, 'Describe responsibilities and impact, not just the job title.', 'Open experience', 0));
      });
    } else if (hasExperience) {
      score += wExp / 2;
      items.push(issue(career, 'weak-experience', 'medium', 'experience', 'Strengthen your experience.', 'Add more achievements to your work history.', 'Improve', wExp / 2));
    } else if (rules.required_sections.includes('experience') && level(career) !== 'fresh') {
      items.push(issue(career, 'missing-experience', 'high', 'experience', 'Add work experience.', 'A CV without experience feels incomplete.', 'Add role', wExp));
    } else if (level(career) === 'fresh') {
      score += wExp; // Freshers get a pass
    }

    // Projects
    const wProj = rules.section_weights.projects || 0;
    if (projects.length > 0) {
      score += wProj;
    } else if (rules.required_sections.includes('projects')) {
      items.push(issue(career, 'missing-project', 'high', 'projects', 'Add one strong project.', 'Projects show proof of skill, especially for practical roles.', 'Add project', wProj));
    } else if (rules.recommended_sections.includes('projects')) {
      items.push(issue(career, 'missing-project', 'medium', 'projects', 'Add a project.', 'Projects add value to your resume.', 'Add project', wProj));
    }

    // Skills
    const wSkill = rules.section_weights.skills || 0;
    if (skills.length >= 6) {
      score += wSkill;
    } else if (skills.length > 0) {
      score += wSkill / 2;
      items.push(issue(career, 'few-skills', 'medium', 'skills', 'Add more relevant skills.', 'ATS scanners need enough field keywords.', 'Suggest skills', wSkill / 2));
    } else if (rules.required_sections.includes('skills')) {
      items.push(issue(career, 'missing-skills', 'high', 'skills', 'Add skills.', 'Skills are crucial for ATS.', 'Add skills', wSkill));
    }

    // Education
    const wEdu = rules.section_weights.education || 0;
    if ((career.education || []).length > 0) {
      score += wEdu;
    } else if (rules.required_sections.includes('education')) {
      items.push(issue(career, 'fresh-education', 'high', 'education', 'Add education for this CV.', 'Education is a core proof point.', 'Add education', wEdu));
    } else if (rules.recommended_sections.includes('education')) {
      items.push(issue(career, 'fresh-education', 'medium', 'education', 'Add education.', 'It strengthens your profile.', 'Add education', wEdu));
    }

    // Certifications (Optional tip that does not penalize score or show as warning)
    const wCert = rules.section_weights.certifications || 0;
    if ((career.certificates || []).length > 0) {
      score += wCert;
    } else if (rules.required_sections.includes('certifications') || rules.recommended_sections.includes('certifications')) {
      items.push(issue(career, 'missing-certs', 'info', 'certificates', 'Professional Certifications (Optional)', 'Certifications are an optional bonus if you have them, but skipping this section will not hurt your core CV score.', '+ Add Cert (Optional)', 0));
    }

    // Penalize if core personal info is missing
    if (!p.name?.trim() || !validEmail) score = Math.min(score, 68);

    const blockers = items.filter(item => item.severity === 'high').length;
    const warnings = items.filter(item => item.severity === 'medium').length;

    return { score: Math.round(score), blockers, warnings, items };
  }

  function localizedIssue(career, id, title, detail, actionLabel) {
    const isAr = isArabic(career);
    const whyMap = {
      'missing-name': {
        ar: 'بدون الاسم الكامل في أعلى السيرة لن يتمكن مسؤول التوظيف أو نظام الفرز الآلي من حفظ ملفك والتعرف عليه.',
        en: 'Without your full name at the top, recruiters and ATS scanners cannot archive or identify your application.'
      },
      'bad-email': {
        ar: 'أنظمة الفرز الآلي (ATS) ترفض الإيميلات غير الصحيحة، ومسؤول التوظيف لن يستطيع مراسلتك لتحديد موعد المقابلة.',
        en: 'ATS scanners reject invalid emails, and recruiters cannot reach out to schedule an interview with you.'
      },
      'missing-phone': {
        ar: 'رقم الهاتف هو وسيلة الاتصال الأسرع والأولى لدعوتك للمقابلات الوظيفية العاجلة.',
        en: 'A phone number is the primary and fastest contact method recruiters use for immediate interview invitations.'
      },
      'missing-github': {
        ar: 'في مجالك (برمجة أو تصميم)، رابط الأعمال أو الـ GitHub هو أول دليل عملي يبحث عنه المقيم الفني قبل قراءة النص.',
        en: 'In your field (development/design), a portfolio or GitHub link is the first proof of competence technical reviewers check.'
      },
      'missing-summary': {
        ar: 'النبذة المهنية هي أول ما يقرأه المدير في أول 6 ثوانٍ، وبدونها قد يتم تجاوز ملفك قبل قراءة تفاصيل الخبرات.',
        en: 'The professional summary is what recruiters read in the first 6 seconds; without it, your profile lacks immediate focus and direction.'
      },
      'short-summary': {
        ar: 'النبذة الحالية قصيرة جداً ولا تبرز تخصصك الدقيق، سنوات خبرتك، أو القيمة المضافة التي ستقدمها للشركة.',
        en: 'Your current summary is too brief to clearly showcase your specialized expertise, experience level, and key value proposition.'
      },
      'long-summary': {
        ar: 'النبذة الطويلة تصعب القراءة السريعة وتستهلك مساحة قيمة يجب تخصيصها للإنجازات العملية.',
        en: 'A lengthy summary makes quick scanning difficult and takes up valuable space that should be used for measurable achievements.'
      },
      'missing-experience': {
        ar: 'السيرة الذاتية بدون خبرة عملية تتطلب إبراز المشاريع والتدريب والأنشطة بوضوح لإقناع أصحاب العمل.',
        en: 'Without work experience, you must clearly highlight practical projects and internships to demonstrate competence.'
      },
      'weak-experience': {
        ar: 'خبراتك مكتوبة كقائمة مسؤوليات عامة بدون أفعال قوية أو أرقام وإنجازات، مما يضعف تأثيرها وتنافسيتها.',
        en: 'Your experience bullets list generic daily duties instead of measurable achievements and action verbs.'
      },
      'missing-project': {
        ar: 'المشاريع العملية هي الإثبات الفعلي لمهاراتك وتطبيقك للأدوات، خاصة في المجالات التقنية والتطبيقية.',
        en: 'Real projects are concrete proof of your technical and practical skills, essential for standing out in competitive roles.'
      },
      'few-skills': {
        ar: 'أنظمة الفرز الآلي (ATS) تبحث عن كلمات مفتاحية ومهارات محددة مرتبطة بالوظيفة؛ نقص المهارات يؤدي لاستبعاد السيرة آلياً.',
        en: 'ATS scanners check for specific domain keywords; too few skills can lead to automatic filtering and low match scores.'
      },
      'missing-skills': {
        ar: 'قسم المهارات هو المحرك الأساسي لتخطي فلتر الـ ATS وإعطاء انطباع سريع بمدى ملاءمتك للمتطلبات.',
        en: 'The skills section is crucial for passing ATS filters and giving recruiters a quick snapshot of your technical fit.'
      },
      'many-skills': {
        ar: 'القائمة الطويلة والعامة من المهارات تقلل المصداقية؛ التركيز على أهم 10-12 مهارة متخصصة يجعل السيرة أقوى وأصدق.',
        en: 'An overly long list of generic skills dilutes credibility; focusing on top 10-12 specialized skills is much more persuasive.'
      },
      'fresh-education': {
        ar: 'المؤهل العلمي والجامعة وسنة التخرج هي معيار الفلترة الأساسي لحديثي التخرج عند الفرز الأولي.',
        en: 'Your degree, institution, and graduation year are the primary qualification filters for early-career roles.'
      },
      'missing-certs': {
        ar: 'الشهادات المهنية هي إضافة اختيارية ممتازة إذا كانت متوفرة لديك، ولكن عدم وجودها لا ينقص من تقييم السيرة الذاتية الأساسي.',
        en: 'Professional certifications are an optional bonus if you have them, but omitting them will not penalize your core score.'
      }
    };

    const fixActionMap = {
      'missing-summary': 'auto-summary',
      'short-summary': 'auto-summary',
      'long-summary': 'auto-summary',
      'weak-experience': 'auto-bullets',
      'few-skills': 'auto-skills',
      'missing-skills': 'auto-skills',
      'missing-name': 'edit-personal',
      'bad-email': 'edit-personal',
      'missing-phone': 'edit-personal',
      'missing-github': 'edit-personal',
      'missing-experience': 'edit-experience',
      'missing-project': 'edit-projects',
      'fresh-education': 'edit-education',
      'missing-certs': 'edit-certificates'
    };

    let whyText = whyMap[id] ? (isAr ? whyMap[id].ar : whyMap[id].en) : (isAr ? 'هذه التفصيلة تحسن من جودة وقراءة السيرة الذاتية في أنظمة التوظيف.' : 'Addressing this improves resume readability and ATS parsing quality.');
    if (id.startsWith('empty-exp')) {
      whyText = isAr ? 'كتابة المسمى الوظيفي فقط بدون تفاصيل لا يعطي مسؤول التوظيف أي فكرة عن إنجازاتك أو حجم مسؤولياتك.' : 'Listing just a job title without details gives recruiters no insight into your contributions or responsibilities.';
    } else if (id.startsWith('thin-bullet') || id.startsWith('metric-bullet')) {
      whyText = isAr ? 'الجمل القصيرة أو الخالية من أرقام تظهر كمهام روتينية وليس كإنجازات قوية تجذب انتباه المقيم.' : 'Short or non-numeric bullets appear as routine tasks rather than high-impact achievements.';
    }

    let fixAction = fixActionMap[id] || (id.startsWith('empty-exp') || id.startsWith('thin-bullet') || id.startsWith('metric-bullet') ? 'auto-bullets' : 'edit-personal');

    if (!isAr) {
      if (id.startsWith('empty-exp')) return { title: 'Add experience bullets.', detail: 'Describe responsibilities and impact, not just the job title.', actionLabel: 'Fix Experience', why: whyText, fixAction };
      if (id.startsWith('thin-bullet')) return { title: 'Improve weak bullet.', detail: 'Very short bullets appear as basic tasks rather than achievements.', actionLabel: 'Improve Bullets', why: whyText, fixAction };
      if (id.startsWith('metric-bullet')) return { title: 'Add measurable result.', detail: 'Numbers and metrics make your impact much more persuasive.', actionLabel: 'Add Metrics', why: whyText, fixAction };
      return { title, detail, actionLabel, why: whyText, fixAction };
    }

    const staticCopy = {
      'missing-name': ['أضف اسمك الكامل.', 'لازم يكون الاسم واضح في أعلى السيرة الذاتية.', 'أضف الاسم'],
      'bad-email': ['أضف بريد إلكتروني صحيح.', 'الإيميل الخاطئ ممكن يمنع وصول مسؤول التوظيف لك.', 'صحح التواصل'],
      'missing-phone': ['أضف رقم الهاتف.', 'السيرة الذاتية الأفضل توفر أكثر من طريقة للتواصل.', 'صحح التواصل'],
      'missing-github': ['أضف GitHub أو Portfolio.', 'ده مهم أكثر لو المجال برمجة أو تصميم.', 'افتح بيانات التواصل'],
      'missing-summary': ['أنشئ نبذة مهنية.', 'النبذة القصيرة بتدي اتجاه للسيرة وتحسن مطابقة الكلمات المفتاحية.', 'إنشاء ذكي'],
      'short-summary': ['قوّي النبذة المهنية.', 'النبذة الحالية قصيرة ومش بتشرح قيمتك بوضوح.', 'تحسين ذكي'],
      'long-summary': ['اختصر النبذة المهنية.', 'النبذة الطويلة بتصعب القراءة وبتاخد مساحة مهمة.', 'اختصار ذكي'],
      'missing-experience': ['أضف الخبرات العملية.', 'السيرة بدون خبرة عملية واضحة هتظهر ناقصة.', 'أضف خبرة'],
      'weak-experience': ['قوّي الخبرات العملية.', 'أضف إنجازات أوضح بدل وصف عام للمسؤوليات.', 'تحسين ذكي'],
      'missing-project': ['أضف مشروع قوي.', 'المشاريع بتثبت المهارات العملية خصوصًا في المجالات التطبيقية.', 'أضف مشروع'],
      'few-skills': ['أضف مهارات مناسبة أكثر.', 'أنظمة ATS تحتاج كلمات مفتاحية كفاية مرتبطة بالمجال.', 'اقترح مهارات'],
      'missing-skills': ['أضف المهارات.', 'قسم المهارات مهم جدًا لأنظمة ATS ومسؤولي التوظيف.', 'أضف مهارات'],
      'many-skills': ['اختصر قائمة المهارات.', 'القائمة المركزة أصدق من قائمة طويلة وعامة.', 'افتح المهارات'],
      'fresh-education': ['أضف التعليم والمؤهل.', 'التعليم دليل أساسي في هذا المجال.', 'أضف التعليم'],
      'missing-certs': ['الشهادات المهنية (اختياري).', 'إضافة اختيارية لتقوية الملف إذا توفرت، ولا تؤثر على التقييم الأساسي.', '+ أضف شهادة (اختياري)']
    };
        if (staticCopy[id]) {
      const [arTitle, arDetail, arAction] = staticCopy[id];
      return { title: arTitle, detail: arDetail, actionLabel: arAction, why: whyText, fixAction };
    }
    if (id.startsWith('empty-exp')) return { title: 'أضف نقاط للخبرة.', detail: 'اكتب المسؤوليات والنتائج، مش المسمى الوظيفي فقط.', actionLabel: 'افتح الخبرة', why: whyText, fixAction };
    if (id.startsWith('thin-bullet')) return { title: 'حسّن نقطة خبرة ضعيفة.', detail: 'الجمل القصيرة جدًا بتظهر كمهام، مش إنجازات.', actionLabel: 'تحسين ذكي', why: whyText, fixAction };
    if (id.startsWith('metric-bullet')) return { title: 'أضف أثر قابل للقياس لو متاح.', detail: 'الأرقام والنتائج بتخلي الإنجاز أكثر إقناعًا.', actionLabel: 'تحسين ذكي', why: whyText, fixAction };
    return { title, detail, actionLabel, why: whyText, fixAction };
  }

  function issue(career, id, severity, section, title, detail, actionLabel, impactPoints = 0) {
    const loc = localizedIssue(career, id, title, detail, actionLabel);
    return { id, severity, section, title: loc.title, detail: loc.detail, actionLabel: loc.actionLabel, impactPoints, why: loc.why, fixAction: loc.fixAction };
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

  
  
  function getRoleAwareMentorAdvice(career) {
    const f = field(career);
    const l = level(career);
    const isAr = isArabic(career);
    const p = career.personalInfo || {};
    const hasExp = (career.experience || []).length > 0;
    const hasSummary = (career.professionalSummary || '').trim().length > 20;

    const jobTitle = career.careerProfile?.jobTitle || industry(career);
    const levelStr = typeof I18n !== 'undefined' ? (l === 'fresh' ? I18n.t('coach.mentor.roles.fresh_graduate', 'Fresh Graduate') : I18n.t('coach.mentor.roles.experienced', 'Experienced')) : (l === 'fresh' ? 'Fresh Graduate' : 'Experienced');
    const headline = typeof I18n !== 'undefined' ? I18n.t('coach.mentor.greetings.you_are', 'You are a {levelStr} {jobTitle}.').replace('{levelStr}', levelStr).replace('{jobTitle}', jobTitle) : `You are a ${levelStr} ${jobTitle}.`;

    let bestStep = '';
    let why = '';
    const nextSteps = [];

    if (f === 'accountant') {
      bestStep = isAr ? 'أفضل خطوة الآن: أضف تدريباً عملياً أو إجادة Excel و ERP بالمستوى المتقدم.' : 'Best step right now: Add practical training or advanced Excel/ERP proficiency.';
      why = isAr ? 'في المحاسبة، أصحاب العمل يبحثون أولاً عن المهارات التطبيقية والدقة والتعامل مع الأنظمة المحاسبية قبل المشاريع العامة.' : 'In accounting, employers look primarily for practical systems proficiency, accuracy, and ERP experience above general projects.';
      if (!hasExp) nextSteps.push(isAr ? 'أضف تدريب عملي (Internship) أو تطبيق محاسبي واقعي في قسم الخبرات.' : 'Add an internship or real-world accounting practice in your experience section.');
      if (!flatSkills(career).some(s => /excel|erp|sap|oracle/i.test(s))) nextSteps.push(isAr ? 'أضف مهارات Excel أو ERP أو SAP بوضوح في قائمة المهارات.' : 'Clearly list Excel, ERP, or SAP in your skills.');
      nextSteps.push(isAr ? 'حول مهامك المحاسبية إلى أرقام وإنجازات (مثال: تقليل وقت إغلاق الحسابات بنسبة 15%).' : 'Turn responsibilities into numeric achievements (e.g., reduced month-end closing time by 15%).');
    } else if (f === 'developer' || f === 'designer' || f === 'ui_ux_designer' || f === 'graphic_designer') {
      bestStep = isAr ? 'أفضل خطوة الآن: أضف رابط الأعمال (Portfolio أو GitHub) ومشروعاً تطبيقياً كاملاً.' : 'Best step right now: Add a portfolio/GitHub link and at least one end-to-end practical project.';
      why = isAr ? 'في المجالات التقنية والتصميمية، معرض الأعمال والمشاريع الحقيقية هي المعيار الأول الذي يقيم به المدير الفني مستواك قبل قراءة أي نص.' : 'In tech and design, your live portfolio and real projects are the #1 criteria technical hiring managers review before reading any text.';
      if ((career.projects || []).length === 0) nextSteps.push(isAr ? 'أضف مشروعاً واحداً على الأقل مع شرح الأدوات المستخدمة والنتيجة.' : 'Add at least one complete project highlighting tools used and outcome.');
      if (!p.links?.github && !p.links?.portfolio && !p.links?.behance) nextSteps.push(isAr ? 'أضف رابط GitHub أو Behance أو الموقع الشخصي في بيانات التواصل.' : 'Add your GitHub, Behance, or live portfolio link in contact info.');
    } else {
      bestStep = isAr ? 'أفضل خطوة الآن: إبراز إنجازات رقمية واضحة وإضافة المهارات الأكثر طلباً في مجالك.' : 'Best step right now: Highlight measurable achievements and add top in-demand skills for your domain.';
      why = isAr ? 'في مستواك الحالي، الوضوح والتركيز على المهارات المتخصصة هو ما يميز سيرتك الذاتية عن المئات من المتقدمين لنفس الوظيفة.' : 'At your current level, clarity and specialized skills are what distinguish your resume from hundreds of applicants.';
      if (!hasExp && l === 'fresh') nextSteps.push(isAr ? 'ركز على إبراز الأنشطة الطلابية، التدريب الصيفي، أو مشاريع التخرج بشكل احترافي.' : 'Focus on professionally showcasing student leadership, internships, or academic projects.');
      if (hasExp) nextSteps.push(isAr ? 'استخدم أفعال قيادة قوية (مثل: قمت بإدارة، طورت، حققت) في بداية كل نقطة خبرة.' : 'Start every bullet point with strong action verbs (e.g., Managed, Developed, Achieved).');
      nextSteps.push(isAr ? 'تأكد من شمول المهارات التقنية المتخصصة المطلوبة في إعلانات التوظيف.' : 'Ensure you include domain-specific technical skills found in target job posts.');
    }

    const quickActions = [
      { id: 'edit-summary', label: isAr ? '⭐ كتابة النبذة المهنية' : '⭐ Write Summary', condition: !hasSummary },
      { id: 'improve-experience', label: isAr ? '🔥 تقوية نقاط الخبرة (أفعال وأرقام)' : '🔥 Improve Experience Bullets', condition: hasExp },
      { id: 'suggest-skills', label: isAr ? '💡 اقتراح مهارات شائعة في مجالك' : '💡 Suggest Domain Skills', condition: true },
      { id: 'tailor-job', label: isAr ? '🎯 تخصيص السيرة لوظيفة محددة (JD)' : '🎯 Tailor to Job Description', condition: true }
    ].filter(a => a.condition).slice(0, 4);

    return {
      headline,
      bestStep,
      why,
      nextSteps,
      quickActions
    };
  }

  function buildCoachInsights(career) {
    const isAr = locale(career) === 'ar';
    const review = getPreExportReview(career);
    
    const score = review.score;
    let scoreLabel = typeof I18n !== 'undefined' ? I18n.t('coach.overview.needs_work', 'Needs Improvement') : 'Needs Improvement';
    if (score >= 80) scoreLabel = typeof I18n !== 'undefined' ? I18n.t('coach.overview.excellent', 'Excellent') : 'Excellent';
    else if (score >= 60) scoreLabel = typeof I18n !== 'undefined' ? I18n.t('coach.overview.good', 'Good') : 'Good';

    const priorities = review.items
      .filter(i => i.severity === 'high' || i.severity === 'medium')
      .slice(0, 3)
      .map(i => ({
        id: i.id,
        title: i.title,
        detail: i.detail,
        actionLabel: i.actionLabel,
        sectionKey: i.section,
        points: i.impactPoints > 0 ? `+${i.impactPoints}%` : '',
        why: i.why || (isAr ? 'هذه الخطوة ضرورية لرفع تقييم السيرة الذاتية وتخطي أنظمة الفرز الآلي (ATS).' : 'Essential for boosting resume score and passing automated ATS screening.'),
        fixAction: i.fixAction || 'edit-personal'
      }));

    const recommended = review.items
      .filter(i => (i.severity === 'medium' || i.severity === 'low') && !priorities.find(p => p.id === i.id))
      .slice(0, 3)
      .map(i => ({
        id: i.id,
        title: i.title,
        sectionKey: i.section
      }));

    const completed = [];
    const p = career.personalInfo || {};
    if (p.name?.trim() && p.email?.trim() && p.phone?.trim()) {
      completed.push({ title: typeof I18n !== 'undefined' ? I18n.t('coach.overview.personal_info', 'Personal Info') : 'Personal Info', sectionKey: 'personalInfo' });
    }
    const hasSummary = career.professionalSummary?.trim().length > 20;
    if (hasSummary && !review.items.find(i => i.section === 'summary')) {
      completed.push({ title: typeof I18n !== 'undefined' ? I18n.t('coach.overview.summary', 'Summary') : 'Summary', sectionKey: 'summary' });
    }
    const hasExp = (career.experience || []).length > 0;
    if (hasExp && !review.items.find(i => i.section === 'experience' && i.severity === 'high')) {
      completed.push({ title: typeof I18n !== 'undefined' ? I18n.t('coach.overview.experience', 'Experience') : 'Experience', sectionKey: 'experience' });
    }
    const hasEdu = (career.education || []).length > 0;
    if (hasEdu && !review.items.find(i => i.section === 'education' && i.severity === 'high')) {
      completed.push({ title: typeof I18n !== 'undefined' ? I18n.t('coach.overview.education', 'Education') : 'Education', sectionKey: 'education' });
    }
    const hasSkills = Object.values(career.skills || {}).flat().length > 0;
    if (hasSkills && !review.items.find(i => i.section === 'skills' && i.severity === 'high')) {
      completed.push({ title: typeof I18n !== 'undefined' ? I18n.t('coach.overview.skills', 'Skills') : 'Skills', sectionKey: 'skills' });
    }

    const todayGoal = {
      currentScore: score,
      targetScore: Math.min(100, score < 70 ? score + 18 : score < 85 ? score + 12 : 100),
      remainingTasksCount: priorities.length,
      completedTasksCount: completed.length
    };

    const mentor = getRoleAwareMentorAdvice(career);

    const hasJD = !!(career.meta && career.meta.targetJD && career.meta.targetJD.trim().length > 15);
    const ats = {
      mode: hasJD ? 'job_match' : 'readiness',
      score: hasJD ? (career.meta.jdMatchScore || 0) : score,
      readinessChecklist: [
        { label: isAr ? 'القالب متوافق مع قراءة أنظمة ATS (بدون جداول أو أعمدة معقدة)' : 'Template is readable by ATS scanners (no complex tables)', ok: true },
        { label: isAr ? 'العناوين واضحة وقياسية (الخبرة، المهارات، التعليم)' : 'Headings are clear and standard (Experience, Skills, Education)', ok: true },
        { label: isAr ? 'بيانات الاتصال كاملة وتحتوي على هاتف وإيميل صحيح' : 'Contact info complete with phone and valid email', ok: !!(p.phone?.trim() && p.email?.trim()) }
      ],
      commonSkills: suggestSkills(career).slice(0, 6),
      missingKeywords: hasJD ? (career.meta.jdMissingKeywords || []) : [],
      foundKeywords: hasJD ? (career.meta.jdFoundKeywords || []) : []
    };

    return {
      score,
      scoreLabel,
      todayGoal,
      top3Problems: priorities,
      recommended,
      completed,
      mentor,
      ats
    };
  }

  return {
    getWizardGuidance,
    analyzeWizardInput,
    getSectionAdvice,
    getPreExportReview,
    applyQuickFix,
    suggestSkills,
    improveExperienceBullets,
    buildFallbackSummary,
    buildCoachInsights,
    getRoleAwareMentorAdvice
  };
})();

if (typeof module !== 'undefined') module.exports = AICoach;
