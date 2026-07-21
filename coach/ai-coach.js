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
    customer_service: { en: 'customer support', ar: 'خدمة العملاء' },
    architect: { en: 'architecture', ar: 'الهندسة المعمارية' },
    civil_engineer: { en: 'civil engineering', ar: 'الهندسة المدنية' },
    mechanical_engineer: { en: 'mechanical engineering', ar: 'الهندسة الميكانيكية' },
    electrical_engineer: { en: 'electrical engineering', ar: 'الهندسة الكهربائية' },
    dentist: { en: 'dentistry', ar: 'طب الأسنان' },
    speech_therapist: { en: 'speech therapy', ar: 'التخاطب والتأهيل' },
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
    customer_service: ['Customer Support', 'CRM', 'Ticket Management', 'Conflict Resolution', 'Service Quality'],
    architect: ['AutoCAD', 'Revit', 'BIM', 'Construction Documents', 'Building Codes'],
    civil_engineer: ['Site Supervision', 'AutoCAD', 'Quantity Surveying', 'Primavera P6', 'Quality Control'],
    mechanical_engineer: ['Mechanical Design', 'HVAC', 'SolidWorks', 'Preventive Maintenance', 'Technical Drawings'],
    electrical_engineer: ['Electrical Design', 'Power Systems', 'PLC', 'ETAP', 'Control Panels'],
    dentist: ['Patient Assessment', 'Treatment Planning', 'Infection Control', 'Clinical Documentation', 'Patient Education'],
    speech_therapist: ['Speech Assessment', 'Therapy Planning', 'Progress Documentation', 'Family Counseling', 'Pediatric Rehabilitation'],
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
    customer_service: ['خدمة العملاء', 'CRM', 'إدارة التذاكر', 'حل النزاعات', 'جودة الخدمة'],
    architect: ['AutoCAD', 'Revit', 'BIM', 'المخططات التنفيذية', 'أكواد البناء'],
    civil_engineer: ['الإشراف على الموقع', 'AutoCAD', 'حصر الكميات', 'Primavera P6', 'ضبط الجودة'],
    mechanical_engineer: ['التصميم الميكانيكي', 'HVAC', 'SolidWorks', 'الصيانة الوقائية', 'الرسومات الفنية'],
    electrical_engineer: ['التصميم الكهربائي', 'أنظمة القوى', 'PLC', 'ETAP', 'لوحات التحكم'],
    dentist: ['تقييم المرضى', 'خطط العلاج', 'مكافحة العدوى', 'التوثيق السريري', 'تثقيف المرضى'],
    speech_therapist: ['تقييم النطق', 'خطط العلاج', 'توثيق التقدم', 'إرشاد الأسرة', 'التأهيل للأطفال'],
    other: ['التواصل', 'حل المشكلات', 'العمل الجماعي', 'التخطيط', 'الاهتمام بالتفاصيل']
  };

  const ACTION_VERBS = ['Built', 'Improved', 'Managed', 'Delivered', 'Designed', 'Implemented', 'Optimized', 'Led'];

  const ROLE_COACH_PROFILES = {
    accountant: {
      ar: { fresh: ['التدريب المحاسبي أو الأعمال التطبيقية الحقيقية', 'Excel والتسويات والتقارير التي استخدمتها فعلاً', 'المؤهل والدورات المهنية التي أنهيتها'], senior: ['حجم الإغلاق المالي أو الميزانيات التي أدرتها', 'قيادة الفريق والرقابة والتدقيق', 'أنظمة ERP وتحسين دورة العمل'] },
      en: { fresh: ['real accounting training or practical work', 'Excel, reconciliation, and reporting tools you actually used', 'completed education and professional courses'], senior: ['scope of close, budgets, or reporting ownership', 'team leadership, controls, and audit impact', 'ERP ownership and process improvement'] },
      projectMode: 'hidden'
    },
    developer: {
      ar: { fresh: ['مشروع عملي كامل يمكن فتحه أو مراجعته', 'GitHub وأدوات التقنية المستخدمة فعلاً', 'شرح مساهمتك والنتيجة بدون مبالغة'], senior: ['نطاق الأنظمة والقرارات المعمارية', 'القيادة الفنية وتأثيرك على الفريق', 'الأداء والاعتمادية والنتائج المقاسة'] },
      en: { fresh: ['one complete verifiable project', 'GitHub and tools you actually used', 'your contribution and outcome without exaggeration'], senior: ['system scope and architecture decisions', 'technical leadership and team impact', 'performance, reliability, and measured outcomes'] },
      projectMode: 'required'
    },
    data_analyst: {
      ar: { fresh: ['مشروع تحليل بيانات موثق', 'SQL وExcel أو Power BI حسب استخدامك الفعلي', 'سؤال العمل والنتيجة التي توصلت لها'], senior: ['قرارات الأعمال التي دعمتها', 'جودة البيانات والحوكمة', 'حجم البيانات وأثر لوحات المعلومات'] },
      en: { fresh: ['a documented analysis project', 'SQL, Excel, or Power BI you genuinely used', 'the business question and result'], senior: ['business decisions you enabled', 'data quality and governance', 'data scale and dashboard impact'] },
      projectMode: 'required'
    },
    designer: {
      ar: { fresh: ['Portfolio واضح بأفضل 2–3 أعمال', 'دورك في كل مشروع وعملية التصميم', 'نتيجة أو دليل استخدام حقيقي'], senior: ['قيادة نظام التصميم أو المنتج', 'أثر البحث والاختبارات على القرارات', 'إدارة أصحاب المصلحة والفريق'] },
      en: { fresh: ['a focused portfolio with 2–3 strong pieces', 'your role and design process', 'a real outcome or usage signal'], senior: ['design-system or product leadership', 'research and testing impact', 'stakeholder and team leadership'] },
      projectMode: 'required'
    },
    ui_ux_designer: { alias: 'designer' }, graphic_designer: { alias: 'designer' },
    teacher: {
      ar: { fresh: ['التدريب الميداني والمادة أو المرحلة', 'تخطيط الدروس وإدارة الفصل', 'نتائج أو ملاحظات تقييم حقيقية'], senior: ['نتائج الطلاب وتطوير المناهج', 'الإشراف أو تدريب المعلمين', 'التقنيات التعليمية والمبادرات'] },
      en: { fresh: ['teaching practicum and grade/subject', 'lesson planning and classroom management', 'real assessment or feedback evidence'], senior: ['student outcomes and curriculum development', 'teacher mentoring or supervision', 'education technology and initiatives'] },
      projectMode: 'hidden'
    },
    doctor: {
      ar: { fresh: ['الامتياز والأقسام السريرية', 'الترخيص والدورات المكتملة', 'المهارات السريرية التي مارستها تحت إشراف'], senior: ['التخصص وحجم الحالات', 'القيادة السريرية وتحسين الجودة', 'الأبحاث أو البروتوكولات إن وجدت'] },
      en: { fresh: ['internship rotations and clinical departments', 'licenses and completed courses', 'supervised clinical competencies'], senior: ['specialty and case volume', 'clinical leadership and quality improvement', 'research or protocols when applicable'] },
      projectMode: 'hidden'
    },
    nurse: {
      ar: { fresh: ['التدريب السريري والأقسام التي مررت بها', 'متابعة المرضى والعلامات الحيوية وإدارة الأدوية تحت إشراف', 'التسجيل المهني والدورات المكتملة'], senior: ['حجم الوحدة أو الوردية والفريق', 'سلامة المرضى وجودة الرعاية', 'الإشراف والتدريب وتحسين الإجراءات'] },
      en: { fresh: ['clinical placements and departments', 'supervised patient monitoring, vital signs, and medication work', 'registration and completed training'], senior: ['unit, shift, and team scope', 'patient safety and quality of care', 'supervision, training, and process improvement'] },
      projectMode: 'hidden'
    },
    pharmacist: {
      ar: { fresh: ['التدريب الصيدلي ونوع البيئة العملية', 'مراجعة الوصفات وإرشاد المرضى أو إدارة المخزون التي مارستها فعلاً', 'الترخيص والدورات المكتملة'], senior: ['حجم التشغيل والمخزون أو قائمة الأدوية', 'السلامة الدوائية والالتزام والجودة', 'قيادة الفريق وتحسين الخدمة'] },
      en: { fresh: ['pharmacy training and practice setting', 'prescription review, counseling, or inventory work you actually performed', 'license and completed courses'], senior: ['operational, inventory, or formulary scope', 'medication safety, compliance, and quality', 'team leadership and service improvement'] },
      projectMode: 'hidden'
    },
    dentist: {
      ar: { fresh: ['الامتياز والحالات والإجراءات التي نفذتها تحت إشراف', 'مكافحة العدوى والتوثيق وخطط العلاج', 'الترخيص والدورات السريرية المكتملة'], senior: ['تنوع الحالات وحجم العيادة', 'نتائج العلاج وتجربة المريض', 'إدارة الفريق أو العيادة وضبط الجودة'] },
      en: { fresh: ['internship cases and supervised procedures', 'infection control, documentation, and treatment planning', 'license and completed clinical courses'], senior: ['case mix and clinic scope', 'treatment outcomes and patient experience', 'team or clinic management and quality control'] },
      projectMode: 'hidden'
    },
    hr: {
      ar: { fresh: ['تدريب التوظيف أو شؤون العاملين', 'أنظمة HR والمهام التي نفذتها', 'التواصل والتنظيم بأمثلة حقيقية'], senior: ['حجم التوظيف أو القوى العاملة', 'السياسات والاحتفاظ وإدارة الأداء', 'قيادة فريق الموارد البشرية والتغيير'] },
      en: { fresh: ['recruitment or personnel training', 'HR systems and tasks you performed', 'real communication and coordination examples'], senior: ['hiring or workforce scale', 'policy, retention, and performance impact', 'HR team and change leadership'] },
      projectMode: 'hidden'
    },
    sales: {
      ar: { fresh: ['التعامل مع العملاء وCRM إن استخدمته', 'نوع المنتج أو السوق', 'نتائج حقيقية بدون أرقام مخترعة'], senior: ['الإيرادات والحصة والمحفظة', 'قيادة الفريق والتوقعات', 'التفاوض والحسابات الاستراتيجية'] },
      en: { fresh: ['customer work and CRM you used', 'product or market context', 'real outcomes without invented metrics'], senior: ['revenue, quota, and portfolio scope', 'team leadership and forecasting', 'negotiation and strategic accounts'] },
      projectMode: 'hidden'
    },
    marketing: {
      ar: { fresh: ['حملات أو محتوى نفذته فعلاً', 'الأدوات والقنوات المستخدمة', 'مؤشر أداء حقيقي إن توفر'], senior: ['الميزانيات والقنوات والاستراتيجية', 'نمو الطلب أو الإيراد المنسوب للحملات', 'قيادة الفريق والوكالات'] },
      en: { fresh: ['campaigns or content you actually delivered', 'tools and channels used', 'a real performance indicator when available'], senior: ['budgets, channels, and strategy', 'demand or revenue contribution', 'team and agency leadership'] },
      projectMode: 'recommended'
    },
    lawyer: {
      ar: { fresh: ['التدريب القانوني والبحث والصياغة', 'نوع القضايا أو العقود دون كشف أسرار', 'الترخيص والعضوية'], senior: ['حجم وتعقيد الملفات', 'التفاوض وإدارة المخاطر', 'قيادة الفريق أو المستشارين'] },
      en: { fresh: ['legal training, research, and drafting', 'matter or contract types without confidential details', 'license and bar membership'], senior: ['matter scale and complexity', 'negotiation and risk management', 'team or counsel leadership'] },
      projectMode: 'hidden'
    },
    project_manager: {
      ar: { fresh: ['تنسيق مشروع حقيقي أو نشاط منظم', 'الأداة والمنهجية المستخدمة', 'التسليم والمخاطر التي تعاملت معها'], senior: ['حجم المحفظة والميزانية', 'أصحاب المصلحة والمخاطر', 'نسب التسليم والتحسين الحقيقية'] },
      en: { fresh: ['a real coordinated project or initiative', 'tools and methodology used', 'delivery and risks handled'], senior: ['portfolio and budget scope', 'stakeholders and risk ownership', 'real delivery and improvement outcomes'] },
      projectMode: 'recommended'
    },
    business_analyst: {
      ar: { fresh: ['جمع المتطلبات ورسم العمليات في حالة حقيقية', 'التواصل مع أصحاب المصلحة وتوثيق القرارات', 'أدوات التحليل التي استخدمتها فعلاً'], senior: ['أثر التحول أو تحسين العمليات', 'تعقيد أصحاب المصلحة والأنظمة', 'حوكمة المتطلبات وقيادة الاكتشاف'] },
      en: { fresh: ['requirements gathering and process mapping in a real case', 'stakeholder communication and decision documentation', 'analysis tools you genuinely used'], senior: ['transformation or process-improvement outcomes', 'stakeholder and system complexity', 'requirements governance and discovery leadership'] },
      projectMode: 'recommended'
    },
    customer_service: {
      ar: { fresh: ['نوع العملاء والقنوات التي تعاملت معها', 'نظام CRM أو التذاكر الذي استخدمته فعلاً', 'مثال حقيقي على حل مشكلة أو تحسين الخدمة'], senior: ['حجم الفريق أو مركز الاتصال', 'مؤشرات الجودة والرضا وزمن الاستجابة', 'تصميم الإجراءات والتصعيد والتدريب'] },
      en: { fresh: ['customer types and support channels', 'CRM or ticketing tools you actually used', 'a real service-resolution example'], senior: ['team or contact-center scope', 'quality, satisfaction, and response metrics', 'process, escalation, and training ownership'] },
      projectMode: 'hidden'
    },
    engineer: {
      ar: { fresh: ['التدريب الميداني ونوع الموقع أو النظام', 'الأدوات والبرامج التي استخدمتها فعلاً', 'مسؤوليتك الفنية ومخرجاتها'], senior: ['حجم المشروع والميزانية والنطاق', 'القيادة الفنية والسلامة والجودة', 'خفض التكلفة أو المخاطر بنتائج حقيقية'] },
      en: { fresh: ['field training and system or site context', 'tools and software genuinely used', 'your technical responsibility and output'], senior: ['project scope, budget, and scale', 'technical leadership, safety, and quality', 'real cost or risk reduction'] },
      projectMode: 'recommended'
    },
    architect: {
      ar: { fresh: ['Portfolio يوضح أفضل المشروعات ودورك فيها', 'AutoCAD أو Revit أو BIM حسب استخدامك الفعلي', 'مراحل التصميم والمخرجات التي أنجزتها'], senior: ['حجم وتعقيد المشروعات', 'التنسيق مع الاستشاريين والجهات وأكواد البناء', 'قيادة التصميم والميزانية والتسليم'] },
      en: { fresh: ['a portfolio showing strong projects and your role', 'AutoCAD, Revit, or BIM you genuinely used', 'design stages and deliverables you completed'], senior: ['project scale and complexity', 'consultant, authority, and code coordination', 'design leadership, budget, and delivery'] },
      projectMode: 'required'
    },
    civil_engineer: { alias: 'engineer' }, mechanical_engineer: { alias: 'engineer' }, electrical_engineer: { alias: 'engineer' },
    speech_therapist: {
      ar: { fresh: ['التدريب السريري والفئات العمرية', 'أدوات التقييم وخطط العلاج التي طبقتها تحت إشراف', 'التراخيص والدورات المكتملة'], senior: ['حجم الحالات والتخصص الدقيق', 'نتائج المتابعة وخطط التأهيل', 'الإشراف السريري وتدريب الفريق'] },
      en: { fresh: ['clinical training and age groups', 'assessment tools and supervised therapy plans', 'licenses and completed training'], senior: ['case volume and specialization', 'follow-up outcomes and rehabilitation plans', 'clinical supervision and team development'] },
      projectMode: 'hidden'
    },
    other: {
      ar: { fresh: ['تدريب أو نشاط عملي مرتبط بالوظيفة', 'مهارات مؤكدة بأمثلة', 'تعليم ودورات مكتملة'], senior: ['نطاق المسؤولية', 'القيادة والقرارات', 'نتائج قابلة للتحقق'] },
      en: { fresh: ['role-related training or practical activity', 'verified skills with examples', 'completed education and courses'], senior: ['scope of responsibility', 'leadership and decisions', 'verifiable outcomes'] },
      projectMode: 'hidden'
    }
  };

  function roleCoachProfile(career) {
    const key = field(career);
    let profile = ROLE_COACH_PROFILES[key] || ROLE_COACH_PROFILES.other;
    if (profile.alias) profile = ROLE_COACH_PROFILES[profile.alias] || ROLE_COACH_PROFILES.other;
    return profile;
  }

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
        body: tr(career, 'Fresh CVs should emphasize education and real practical evidence. Senior CVs should emphasize scope, impact, and leadership.', 'لو حديث تخرج نركز على التعليم والدليل العملي المناسب للمهنة. ولو Senior نركز على النطاق والتأثير والقيادة.')
      },
      profile: {
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
    if (step === 'email' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text)) {
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
    if (!p.title?.trim()) items.push(issue(career, 'missing-title', 'high', 'personalInfo', 'Add your target job title.', 'The target title tells recruiters and the coach what role this CV is built for.', 'Add title'));
    if (!career.careerProfile?.field || career.careerProfile.field === 'other') items.push(issue(career, 'missing-career-profile', 'medium', 'personalInfo', 'Confirm your profession.', 'Role-aware guidance needs your actual profession and level.', 'Set profession'));

    const searchable = [p.name, p.title, summary, ...exp.flatMap(e => [e.company, e.role, e.rawDescription, ...(e.bullets || [])]), ...(career.education || []).flatMap(e => [e.degree, e.school, e.institution]), ...skills].filter(Boolean).join(' ').toLowerCase();
    const hasPlaceholderData = /leading organization|accredited university|professional development program|senior specialist \/ leader|example company|شركة رائدة|جامعة معتمدة|بيانات تجريبية/.test(searchable);
    if (hasPlaceholderData) items.push(issue(career, 'placeholder-data', 'high', 'personalInfo', 'Replace sample information.', 'The CV contains text that looks like demo data and must not be exported as real experience.', 'Review data'));

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
      const roleProfile = roleCoachProfile(career);
      const hasAlternativeProof = projects.length > 0;
      score += hasAlternativeProof && roleProfile.projectMode === 'required' ? wExp * 0.65 : wExp * 0.2;
      if (!hasAlternativeProof || roleProfile.projectMode !== 'required') {
        items.push(issue(career, 'fresh-practical-evidence', 'medium', 'experience', 'Add practical evidence.', 'Add an internship, clinical rotation, teaching practicum, freelance work, volunteering, or another real activity relevant to your profession.', 'Add practical experience', Math.round(wExp * 0.5)));
      }
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

    // Certifications and licenses
    const wCert = rules.section_weights.certifications || 0;
    if ((career.certificates || []).length > 0) {
      score += wCert;
    } else if (rules.required_sections.includes('certifications')) {
      items.push(issue(career, 'missing-certs', 'high', 'certificates', 'Add required licenses or certifications.', 'For this profession, verified licenses or certifications are a core qualification. Add only credentials you actually hold.', 'Add credential', wCert));
    } else if (rules.recommended_sections.includes('certifications')) {
      items.push(issue(career, 'missing-certs', 'info', 'certificates', 'Add certifications if you hold them.', 'Credentials are optional here and should only be listed when verified.', '+ Add credential', 0));
    }

    // Penalize if core identity or trust data is missing.
    if (!p.name?.trim() || !validEmail || !p.title?.trim()) score = Math.min(score, 68);
    if (hasPlaceholderData) score = Math.min(score, 45);
    score = Math.max(0, Math.min(100, score));

    const blockers = items.filter(item => item.severity === 'high').length;
    const warnings = items.filter(item => item.severity === 'medium').length;

    return { score: Math.round(score), blockers, warnings, items };
  }

  function localizedIssue(career, id, title, detail, actionLabel) {
    const isAr = isArabic(career);
    const whyMap = {
      'missing-name': {
        ar: 'الاسم الكامل والواضح يساعد مسؤول التوظيف على التعرف على ملفك وربطه بطلب التقديم.',
        en: 'A clear full name helps recruiters identify your resume and connect it to your application.'
      },
      'bad-email': {
        ar: 'البريد غير الصحيح يمنع مسؤول التوظيف من التواصل معك، حتى لو كان محتوى السيرة قويًا.',
        en: 'An invalid email prevents recruiters from contacting you even when the resume content is strong.'
      },
      'missing-phone': {
        ar: 'رقم الهاتف هو وسيلة الاتصال الأسرع والأولى لدعوتك للمقابلات الوظيفية العاجلة.',
        en: 'A phone number is the primary and fastest contact method recruiters use for immediate interview invitations.'
      },
      'missing-title': {
        ar: 'المسمى المستهدف يحدد اتجاه السيرة ويمنع ظهور نصائح عامة لا تناسب الوظيفة.',
        en: 'A target title gives the resume direction and prevents generic role guidance.'
      },
      'missing-career-profile': {
        ar: 'تحديد المجال والمستوى ضروري حتى تكون النصائح والأقسام المقترحة مناسبة لك.',
        en: 'Profession and level are required for role-aware sections and coaching.'
      },
      'placeholder-data': {
        ar: 'تصدير بيانات تجريبية كشركة أو جامعة غير حقيقية يضر بمصداقيتك المهنية.',
        en: 'Exporting sample employers or schools as real facts harms professional credibility.'
      },
      'fresh-practical-evidence': {
        ar: 'حديث التخرج يحتاج دليلاً عملياً مناسباً للمهنة مثل تدريب أو امتياز أو تطبيق حقيقي، وليس مشروعاً عاماً بالضرورة.',
        en: 'Early-career resumes need role-appropriate practical evidence such as an internship, practicum, rotation, or real work.'
      },
      'missing-github': {
        ar: 'في مجالك (برمجة أو تصميم)، رابط الأعمال أو الـ GitHub هو أول دليل عملي يبحث عنه المقيم الفني قبل قراءة النص.',
        en: 'In your field (development/design), a portfolio or GitHub link is the first proof of competence technical reviewers check.'
      },
      'missing-summary': {
        ar: 'النبذة المهنية توضح اتجاه السيرة بسرعة وتساعد القارئ على فهم تخصصك وقيمتك قبل التفاصيل.',
        en: 'A professional summary quickly clarifies your direction, specialty, and value before the reader reaches the details.'
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
        ar: 'قسم المهارات المركّز يساعد على إظهار مدى ارتباط خبرتك بالوظيفة، بشرط إضافة المهارات التي تمتلكها فعلاً.',
        en: 'A focused skills section makes role alignment clearer, provided it lists only skills you genuinely have.'
      },
      'missing-skills': {
        ar: 'قسم المهارات يعطي ملخصًا سريعًا لما تستخدمه فعلاً، ويسهّل مقارنة السيرة بمتطلبات الوظيفة.',
        en: 'The skills section gives recruiters a quick view of what you genuinely use and supports comparison with job requirements.'
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
      'missing-title': 'edit-personal',
      'missing-career-profile': 'edit-personal',
      'placeholder-data': 'edit-personal',
      'missing-github': 'edit-personal',
      'missing-experience': 'edit-experience',
      'fresh-practical-evidence': 'edit-experience',
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
      'missing-title': ['أضف المسمى الوظيفي المستهدف.', 'المسمى يحدد اتجاه السيرة ونوعية النصائح.', 'حدد المسمى'],
      'missing-career-profile': ['حدد مجالك ومستواك.', 'المساعد يحتاج المجال والمستوى حتى يقدم نصائح مناسبة.', 'حدد المجال'],
      'placeholder-data': ['استبدل البيانات التجريبية.', 'وجدنا معلومات تبدو كنموذج وليست بيانات حقيقية.', 'راجع البيانات'],
      'fresh-practical-evidence': ['أضف دليلاً عملياً مناسباً.', 'يمكن أن يكون تدريباً أو امتيازاً أو تطوعاً أو عملاً حراً حسب مهنتك.', 'أضف نشاطاً حقيقياً'],
      'missing-github': ['أضف GitHub أو Portfolio.', 'ده مهم أكثر لو المجال برمجة أو تصميم.', 'افتح بيانات التواصل'],
      'missing-summary': ['أنشئ نبذة مهنية.', 'النبذة القصيرة بتدي اتجاه للسيرة وتحسن مطابقة الكلمات المفتاحية.', 'إنشاء ذكي'],
      'short-summary': ['قوّي النبذة المهنية.', 'النبذة الحالية قصيرة ومش بتشرح قيمتك بوضوح.', 'تحسين ذكي'],
      'long-summary': ['اختصر النبذة المهنية.', 'النبذة الطويلة بتصعب القراءة وبتاخد مساحة مهمة.', 'اختصار ذكي'],
      'missing-experience': ['أضف الخبرات العملية.', 'السيرة بدون خبرة عملية واضحة هتظهر ناقصة.', 'أضف خبرة'],
      'weak-experience': ['قوّي الخبرات العملية.', 'أضف إنجازات أوضح بدل وصف عام للمسؤوليات.', 'تحسين ذكي'],
      'missing-project': ['أضف مشروع قوي.', 'المشاريع بتثبت المهارات العملية خصوصًا في المجالات التطبيقية.', 'أضف مشروع'],
      'few-skills': ['راجع المهارات المرتبطة بالوظيفة.', 'أضف فقط المهارات المرتبطة بالمجال التي تستخدمها فعلاً.', 'راجع المهارات'],
      'missing-skills': ['أضف مهاراتك الفعلية.', 'قسم المهارات يلخص الأدوات والقدرات التي تستخدمها ويسهّل مقارنة السيرة بالوظيفة.', 'أضف مهارات'],
      'many-skills': ['اختصر قائمة المهارات.', 'القائمة المركزة أصدق من قائمة طويلة وعامة.', 'افتح المهارات'],
      'fresh-education': ['أضف التعليم والمؤهل.', 'التعليم دليل أساسي في هذا المجال.', 'أضف التعليم'],
      'missing-certs': ['أضف الترخيص أو الشهادة المطلوبة.', 'أضف فقط اعتماداً مهنياً حقيقياً وساريًا تملكه.', 'أضف اعتماداً']
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

    if (issueId === 'few-skills' || issueId === 'missing-skills') {
      return { section: 'skills', message: tr(career, 'Review suggested skills and confirm only the ones you genuinely have.', 'راجع المهارات المقترحة وأكد فقط ما تمتلكه فعلاً.') };
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
    const ar = isArabic(career);
    const weakAr = /^(مسؤول عن|كنت مسؤولاً عن|قمت ب|ساعدت في)\s*/i;
    const weakEn = /^(responsible for|helped with|worked on|tasked with)\s*/i;
    (career.experience || []).forEach(entry => {
      const source = entry.bullets?.length ? entry.bullets : [entry.rawDescription || entry.role].filter(Boolean);
      entry.bullets = source.map((bullet, index) => {
        const text = String(bullet || '').trim();
        if (!text) return '';
        if (ar) {
          // Improve weak phrasing without adding metrics, tools, or outcomes that the user did not provide.
          if (weakAr.test(text)) return text.replace(weakAr, index % 2 ? 'نفذت ' : 'أدرت ');
          return text;
        }
        if (weakEn.test(text)) {
          const verbs = ['Managed', 'Delivered', 'Implemented', 'Coordinated'];
          const rest = text.replace(weakEn, '').replace(/^./, char => char.toLowerCase());
          return `${verbs[index % verbs.length]} ${rest}`.trim();
        }
        return text;
      }).filter(Boolean);
      entry.rawDescription = entry.bullets.join('\n');
    });
  }

  function titleCase(text) {
    return String(text || '').replace(/\b\w/g, char => char.toUpperCase());
  }

  
  
  function getRoleAwareMentorAdvice(career) {
    const isAr = isArabic(career);
    const f = field(career);
    const l = level(career);
    const profile = roleCoachProfile(career);
    const stage = ['mid', 'senior'].includes(l) ? 'senior' : 'fresh';
    const priorities = (profile[isAr ? 'ar' : 'en']?.[stage] || ROLE_COACH_PROFILES.other[isAr ? 'ar' : 'en'][stage]).slice(0, 3);
    const title = career.personalInfo?.title?.trim() || industry(career);
    const specialization = career.careerProfile?.specialization?.trim();
    const years = career.careerProfile?.years?.toString().trim();
    const hasExp = (career.experience || []).length > 0;
    const hasSummary = (career.professionalSummary || '').trim().length > 20;
    const hasVerifiedSkills = flatSkills(career).length >= 4;

    const roleTitle = specialization || title;
    const headline = isAr
      ? (l === 'fresh'
        ? `أنت تستهدف وظيفة ${roleTitle} كحديث تخرج.`
        : l === 'senior'
          ? `أنت تستهدف وظيفة ${roleTitle} بخبرة Senior.`
          : l === 'mid'
            ? `أنت تستهدف وظيفة ${roleTitle} بخبرة متوسطة.`
            : `أنت تستهدف وظيفة ${roleTitle} في بداية مسارك المهني.`)
      : (l === 'fresh'
        ? `You are targeting ${roleTitle} as a fresh graduate.`
        : l === 'senior'
          ? `You are targeting ${roleTitle} as a senior professional.`
          : l === 'mid'
            ? `You are targeting ${roleTitle} at mid level.`
            : `You are targeting ${roleTitle} at an early-career level.`);

    const bestStep = isAr
      ? `أفضل خطوة الآن: ${!hasSummary ? 'اكتب نبذة مهنية مبنية على بياناتك الحقيقية.' : !hasExp && l !== 'fresh' ? 'أضف خبرتك الفعلية ونطاق مسؤوليتك.' : !hasVerifiedSkills ? 'أكد المهارات التي تستخدمها فعلاً.' : priorities[0] + '.'}`
      : `Best next step: ${!hasSummary ? 'write a summary grounded in your real facts.' : !hasExp && l !== 'fresh' ? 'add your actual experience and scope.' : !hasVerifiedSkills ? 'confirm skills you genuinely use.' : priorities[0] + '.'}`;

    const experienceContext = isAr
      ? (l === 'fresh' ? 'بما أنك في بداية المسار، ركّز على التدريب والممارسة الحقيقية.' : years ? `مستوى الخبرة المسجل هو ${years}؛ لذلك يجب أن يعكس المحتوى نفس نطاق المسؤولية.` : '')
      : (l === 'fresh' ? 'Because you are early in your career, focus on genuine training and practical evidence.' : years ? `Your recorded experience level is ${years}; the content should reflect that scope.` : '');
    const why = isAr
      ? `لأن التوظيف في ${specialization || industry(career)} يعتمد على أدلة مرتبطة بالدور والمستوى، وليس على قائمة عامة من الكلمات. ${experienceContext}`
      : `Hiring in ${specialization || industry(career)} depends on role- and level-specific evidence, not a generic keyword list. ${experienceContext}`;

    const nextSteps = priorities.map(item => isAr ? `ركّز على ${item}.` : `Focus on ${item}.`);
    const quickActions = [
      { id: 'edit-summary', label: isAr ? '⭐ كتابة النبذة من بياناتي' : '⭐ Build summary from my facts', condition: !hasSummary },
      { id: 'improve-experience', label: isAr ? '🔥 تحسين صياغة الخبرة مع المعاينة' : '🔥 Improve experience with preview', condition: hasExp },
      { id: 'suggest-skills', label: isAr ? '💡 مراجعة مهارات مناسبة' : '💡 Review relevant skills', condition: true },
      { id: 'tailor-job', label: isAr ? '🎯 مقارنة بوظيفة محددة' : '🎯 Compare with a target job', condition: true }
    ].filter(item => item.condition).slice(0, 4);

    return { headline, bestStep, why, nextSteps, quickActions, projectMode: profile.projectMode || 'hidden', role: f, level: l };
  }

  function getATSReadiness(career) {
    const ar = isArabic(career);
    const p = career.personalInfo || {};
    const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(p.email || '');
    const selectedTemplate = career.meta?.templateId || 'ai-recommended';
    const resolvedTemplate = typeof career.meta?._resolvedTemplate === 'string' ? career.meta._resolvedTemplate : career.meta?._resolvedTemplate?.id;
    const templateId = selectedTemplate === 'ai-recommended' ? (resolvedTemplate || 'classic') : selectedTemplate;
    const atsFriendlyTemplates = new Set(['ai-recommended', 'ats', 'classic', 'compact', 'minimal', 'corporate', 'executive']);
    const templateOk = atsFriendlyTemplates.has(templateId);
    const hasCoreSections = !!((career.experience || []).length || (career.education || []).length) && flatSkills(career).length > 0;
    const hasDirection = !!p.title?.trim() && wordCount(career.professionalSummary || '') >= 12;
    const text = [p.name, p.title, career.professionalSummary, ...(career.experience || []).flatMap(e => [e.company, e.role, e.rawDescription]), ...(career.education || []).flatMap(e => [e.degree, e.school, e.institution])].filter(Boolean).join(' ').toLowerCase();
    const cleanData = !/leading organization|accredited university|professional development program|senior specialist \/ leader|example company|شركة رائدة|جامعة معتمدة|بيانات تجريبية/.test(text);
    const checks = [
      { key: 'contact', points: 25, ok: !!(p.name?.trim() && validEmail && p.phone?.trim()), label: ar ? 'الاسم والإيميل والهاتف مكتملة' : 'Name, valid email, and phone are complete' },
      { key: 'direction', points: 20, ok: hasDirection, label: ar ? 'المسمى والنبذة يوضحان اتجاه السيرة' : 'Target title and summary provide clear direction' },
      { key: 'sections', points: 20, ok: hasCoreSections, label: ar ? 'الأقسام الأساسية موجودة بعناوين واضحة' : 'Core sections are present with standard headings' },
      { key: 'template', points: 25, ok: templateOk, label: ar ? 'القالب الحالي بسيط ومناسب للقراءة الآلية' : 'Current template is simple and machine-readable' },
      { key: 'truth', points: 10, ok: cleanData, label: ar ? 'لا توجد بيانات نموذجية أو تجريبية ظاهرة' : 'No visible sample or placeholder data' }
    ];
    return { score: checks.reduce((sum, item) => sum + (item.ok ? item.points : 0), 0), checks, templateOk };
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
        impactLabel: i.severity === 'high'
          ? (isAr ? 'تأثير مرتفع' : 'High impact')
          : (isAr ? 'تأثير متوسط' : 'Medium impact'),
        why: i.why || (isAr ? 'هذه الخطوة تحسن وضوح السيرة واتساقها مع هدفك المهني.' : 'This improves resume clarity and alignment with your career target.'),
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

    const hasJD = !!(career.meta && career.meta.targetJD && career.meta.targetJD.trim().length > 80);
    const readiness = getATSReadiness(career);
    const ats = {
      mode: hasJD ? 'job_match' : 'readiness',
      score: hasJD ? Number(career.meta.jdMatchScore || 0) : readiness.score,
      readinessScore: readiness.score,
      readinessChecklist: readiness.checks,
      commonSkills: suggestSkills(career).slice(0, 6),
      missingKeywords: hasJD ? (career.meta.jdMissingKeywords || []) : [],
      foundKeywords: hasJD ? (career.meta.jdFoundKeywords || []) : [],
      disclaimer: isAr ? 'نسبة المطابقة مؤشر مساعد مبني على الكلمات وليست ضماناً للقبول.' : 'The match score is a keyword-based aid, not a hiring guarantee.'
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
    getRoleAwareMentorAdvice,
    getATSReadiness,
    roleCoachProfile
  };
})();

if (typeof module !== 'undefined') module.exports = AICoach;
