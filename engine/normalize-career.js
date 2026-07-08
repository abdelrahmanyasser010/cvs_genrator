/**
 * Normalize career data from various formats to unified schema.
 */
const CareerNormalize = (function () {
  function getBullets(entry) {
    if (entry.bullets && entry.bullets.length) return entry.bullets;
    if (entry.achievements && entry.achievements.length) return entry.achievements;
    if (entry.responsibilities && entry.responsibilities.length) return entry.responsibilities;
    return [];
  }

  function normalizeProject(p) {
    const links = p.links || {};
    if (links.appleStore && !links.appStore) links.appStore = links.appleStore;
    return {
      name: p.name || p.title || 'Untitled Project',
      category: p.category || '',
      desc: p.desc || p.overview || '',
      bullets: p.bullets || p.responsibilities || [],
      tech: p.tech || (Array.isArray(p.techStack) ? p.techStack.join(' · ') : ''),
      role: p.role || '',
      challenge: p.challenge || (p.challengesAndSolutions && p.challengesAndSolutions[0]?.challenge) || '',
      achievement: p.achievement || '',
      links: {
        googlePlay: links.googlePlay || links.riderGooglePlay || '',
        appStore: links.appStore || '',
        github: links.github || '',
        website: links.website || ''
      }
    };
  }

  function normalizeLanguage(l) {
    if (typeof l === 'string') {
      const parts = l.match(/^(.+?)\s*\((.+)\)$/);
      if (parts) return { lang: parts[1].trim(), level: parts[2].trim() };
      return { lang: l, level: '' };
    }
    return { lang: l.lang || l.language || '', level: l.level || '' };
  }

  function normalizeSkills(skills) {
    if (!skills || typeof skills !== 'object') return {};
    const out = {};
    for (const [key, val] of Object.entries(skills)) {
      const label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
      out[label] = Array.isArray(val) ? val : [String(val)];
    }
    return out;
  }

  function createEmpty() {
    const now = new Date().toISOString();
    return {
      personalInfo: {
        name: '',
        title: '',
        email: '',
        phone: '',
        location: '',
        links: { linkedin: '', github: '' }
      },
      careerProfile: { field: 'other', specialization: '', level: 'junior' },
      professionalSummary: '',
      experience: [],
      projects: [],
      skills: {},
      education: [],
      languages: [],
      meta: { locale: 'en', templateId: 'ai-recommended', selectedSummaryId: '', createdAt: now, updatedAt: now }
    };
  }

  function normalize(raw) {
    if (!raw) return createEmpty();
    const base = createEmpty();
    const merged = {
      ...base,
      ...raw,
      personalInfo: { ...base.personalInfo, ...(raw.personalInfo || {}) },
      careerProfile: { ...base.careerProfile, ...(raw.careerProfile || {}) },
      meta: { ...base.meta, ...(raw.meta || {}) }
    };

    if (raw.personalInfo?.links) {
      merged.personalInfo.links = { ...base.personalInfo.links, ...raw.personalInfo.links };
    }

    merged.experience = (raw.experience || []).map(e => ({
      company: e.company || '',
      role: e.role || '',
      period: e.period || '',
      bullets: getBullets(e),
      rawDescription: e.rawDescription || ''
    }));

    merged.projects = (raw.projects || []).map(normalizeProject);
    merged.skills = normalizeSkills(raw.skills);
    merged.education = raw.education || [];
    merged.languages = (raw.languages || []).map(normalizeLanguage);
    merged.professionalSummary = raw.professionalSummary || '';

    merged.meta.updatedAt = new Date().toISOString();
    if (!merged.meta.createdAt) merged.meta.createdAt = merged.meta.updatedAt;

    return merged;
  }

  function getProfessionPlaceholders(field, lang) {
    const isAr = lang === 'ar' || lang === 'ar-EG';
    const map = {
      accountant: {
        title: isAr ? 'مثال: محاسب مالي / أول' : 'e.g. Senior Financial Accountant',
        summary: isAr ? 'مثال: محاسب مالي بخبرة 5+ سنوات في إدارة الحسابات العامة، الميزانيات، والتقارير المالية...' : 'e.g. Financial Accountant with 5+ years of experience in general ledger, budgeting, and financial reporting...',
        skillCat: isAr ? 'مثال: المحاسبة والمالية' : 'e.g. Accounting & Finance',
        skills: isAr ? 'إكسل المتقدم، التحليل المالي، الميزانيات، إعداد التقارير، SAP ERP، الضرائب' : 'Advanced Excel, Financial Analysis, Budgeting, Financial Reporting, SAP ERP, Tax Preparation',
        degree: isAr ? 'مثال: بكالوريوس تجارة - قسم محاسبة' : 'e.g. Bachelor of Commerce in Accounting',
        projName: isAr ? 'مثال: تطوير نظام الميزانية التقديرية' : 'e.g. Annual Budget & Forecasting Model',
        projTech: isAr ? 'Excel, SAP ERP, QuickBooks, Power BI' : 'Excel, SAP ERP, QuickBooks, Power BI'
      },
      doctor: {
        title: isAr ? 'مثال: طبيب عام / أخصائي' : 'e.g. General Practitioner / Resident Doctor',
        summary: isAr ? 'مثال: طبيب ذو خبرة في الرعاية السريرية وتشخيص الحالات وإدارة الطوارئ الطبية...' : 'e.g. Dedicated Physician with extensive experience in clinical care, diagnosis, and patient management...',
        skillCat: isAr ? 'مثال: المهارات السريرية الطبية' : 'e.g. Clinical Competencies',
        skills: isAr ? 'التشخيص السريري، رعاية المرضى، تخطيط القلب (ECG)، قراءة التحاليل، الطوارئ، الإسعافات' : 'Clinical Diagnosis, Patient Care, ECG Interpretation, Lab Analysis, Emergency Medicine',
        degree: isAr ? 'مثال: بكالوريوس الطب والجراحة (MBBS)' : 'e.g. Bachelor of Medicine, Bachelor of Surgery (MBBS)',
        projName: isAr ? 'مثال: مبادرة تحسين جودة رعاية المرضى' : 'e.g. Patient Care Quality Improvement Initiative',
        projTech: isAr ? 'حالات سريرية، أجهزة تشخيصية، بروتوكولات صحية' : 'Clinical Diagnostic Tools, Healthcare Protocols'
      },
      teacher: {
        title: isAr ? 'مثال: معلم مرحلة ثانوية / أول' : 'e.g. Senior High School Teacher',
        summary: isAr ? 'مثال: معلم شغوف بتطوير المناهج وتوظيف التكنولوجيا في التعليم التفاعلي...' : 'e.g. Dedicated Teacher passionate about curriculum development and interactive learning...',
        skillCat: isAr ? 'مثال: المهارات التدريسية والتربوية' : 'e.g. Teaching & Pedagogy',
        skills: isAr ? 'إدارة الفصل، تصميم المناهج، التعلم التفاعلي، تقييم الطلاب، تكنولوجيا التعليم، التعلم عن بعد' : 'Classroom Management, Curriculum Design, Interactive Learning, Student Assessment, EdTech',
        degree: isAr ? 'مثال: بكالوريوس تربية / دبلوم عام في التربية' : 'e.g. Bachelor of Education / Teaching Diploma',
        projName: isAr ? 'مثال: تصميم منهج تفاعلي رقمي' : 'e.g. Interactive Digital Curriculum Module',
        projTech: isAr ? 'أدوات تفاعلية، عروض تقديمية، مناهج حديثة، LMS' : 'EdTech Tools, LMS, PowerPoint, Interactive Media'
      },
      lawyer: {
        title: isAr ? 'مثال: محامي ومستشار قانوني' : 'e.g. Legal Counsel / Attorney at Law',
        summary: isAr ? 'مثال: مستشار قانوني بخبرة في صياغة العقود، التقاضي، والتحكيم التجاري...' : 'e.g. Experienced Legal Counsel specializing in corporate law, contract negotiation, and litigation...',
        skillCat: isAr ? 'مثال: المهارات القانونية والاستشارات' : 'e.g. Legal Practice & Counseling',
        skills: isAr ? 'الصياغة القانونية، التقاضي، البحث القانوني، صياغة العقود والتفاوض، المرافعة، التحكيم' : 'Legal Drafting, Litigation, Legal Research, Contract Negotiation, Court Advocacy, Arbitration',
        degree: isAr ? 'مثال: ليسانس حقوق / ماجستير في القانون' : 'e.g. Bachelor of Laws (LLB) / Master of Laws (LLM)',
        projName: isAr ? 'مثال: إدارة وتفاوض عقود تجارية كبرى' : 'e.g. Major Commercial Contract Negotiation',
        projTech: isAr ? 'صياغة عقود، أبحاث قانونية، قوانين تجارية' : 'Legal Research, Contract Drafting, Corporate Law'
      },
      safety: {
        title: isAr ? 'مثال: أخصائي سلامة وصحة مهنية' : 'e.g. HSE Specialist / Safety Officer',
        summary: isAr ? 'مثال: أخصائي سلامة معتمد بخبرة في تطبيق معايير الأوشا وتقييم المخاطر وتأمين المواقع...' : 'e.g. Certified HSE Officer with proven track record in OSHA compliance, risk assessment, and site safety...',
        skillCat: isAr ? 'مثال: السلامة والصحة المهنية' : 'e.g. HSE & Industrial Safety',
        skills: isAr ? 'تقييم المخاطر، معايير الأوشا (OSHA)، خطط الطوارئ، السلامة المهنية، تقارير الحوادث، NEBOSH' : 'Risk Assessment, OSHA Compliance, Emergency Planning, Industrial Safety, Incident Reporting, NEBOSH',
        degree: isAr ? 'مثال: بكالوريوس هندسة + شهادة الأوشا/نيبوش' : 'e.g. B.Sc Engineering + NEBOSH IGC / OSHA',
        projName: isAr ? 'مثال: تطبيق خطة الطوارئ والسلامة للموقع' : 'e.g. Site Emergency & Safety Plan Implementation',
        projTech: isAr ? 'OSHA, NEBOSH, تقييم مخاطر، خطط طوارئ، EHS' : 'OSHA Standards, Risk Assessment Matrix, EHS'
      },
      safety_officer: {
        title: isAr ? 'مثال: أخصائي سلامة وصحة مهنية' : 'e.g. HSE Specialist / Safety Officer',
        summary: isAr ? 'مثال: أخصائي سلامة معتمد بخبرة في تطبيق معايير الأوشا وتقييم المخاطر وتأمين المواقع...' : 'e.g. Certified HSE Officer with proven track record in OSHA compliance, risk assessment, and site safety...',
        skillCat: isAr ? 'مثال: السلامة والصحة المهنية' : 'e.g. HSE & Industrial Safety',
        skills: isAr ? 'تقييم المخاطر، معايير الأوشا (OSHA)، خطط الطوارئ، السلامة المهنية، تقارير الحوادث، NEBOSH' : 'Risk Assessment, OSHA Compliance, Emergency Planning, Industrial Safety, Incident Reporting, NEBOSH',
        degree: isAr ? 'مثال: بكالوريوس هندسة + شهادة الأوشا/نيبوش' : 'e.g. B.Sc Engineering + NEBOSH IGC / OSHA',
        projName: isAr ? 'مثال: تطبيق خطة الطوارئ والسلامة للموقع' : 'e.g. Site Emergency & Safety Plan Implementation',
        projTech: isAr ? 'OSHA, NEBOSH, تقييم مخاطر، خطط طوارئ، EHS' : 'OSHA Standards, Risk Assessment Matrix, EHS'
      },
      nurse: {
        title: isAr ? 'مثال: ممرض قانوني / عناية مركزة' : 'e.g. Staff Nurse / ICU Registered Nurse',
        summary: isAr ? 'مثال: ممرض ذو كفاءة عالية في الرعاية السريرية ومراقبة المرضى وإدارة الأدوية...' : 'e.g. Dedicated Registered Nurse with expertise in clinical care, vital monitoring, and patient administration...',
        skillCat: isAr ? 'مثال: الرعاية التمريضية والسريرية' : 'e.g. Clinical Nursing Care',
        skills: isAr ? 'الرعاية السريرية، مراقبة العلامات الحيوية، إدارة الأدوية، رعاية الطوارئ، الإسعافات الأولية، مكافحة العدوى' : 'Clinical Care, Vital Signs Monitoring, Medication Administration, Emergency Care, Infection Control',
        degree: isAr ? 'مثال: بكالوريوس علوم التمريض' : 'e.g. Bachelor of Science in Nursing (BSN)',
        projName: isAr ? 'مثال: برنامج تحسين مكافحة العدوى في الجناح' : 'e.g. Ward Infection Control Improvement Program',
        projTech: isAr ? 'رعاية سريرية، بروتوكولات تمريض، أجهزة قياس حيوية' : 'Clinical Protocols, Vital Monitoring Systems'
      },
      pharmacist: {
        title: isAr ? 'مثال: صيدلي إكلينيكي / أول' : 'e.g. Clinical Pharmacist / Pharmacy Manager',
        summary: isAr ? 'مثال: صيدلي متميز بخبرة في صرف الوصفات الطبية، الرعاية الصيدلانية، وإدارة المخزون...' : 'e.g. Professional Pharmacist experienced in prescription dispensing, patient counseling, and drug safety...',
        skillCat: isAr ? 'مثال: العلوم الصيدلانية والرعاية' : 'e.g. Pharmaceutical Care',
        skills: isAr ? 'علم الأدوية، صرف الوصفات الطبية، الرعاية الصيدلانية، تفاعلات الأدوية، إدارة المخزون، استشارات المرضى' : 'Pharmacology, Prescription Dispensing, Patient Counseling, Drug Interactions, Inventory Management',
        degree: isAr ? 'مثال: بكالوريوس الصيدلة / فارم دي (PharmD)' : 'e.g. Doctor of Pharmacy (PharmD) / B.Pharm',
        projName: isAr ? 'مثال: تطوير نظام مراقبة صرف الأدوية' : 'e.g. Drug Dispensing & Safety Monitoring System',
        projTech: isAr ? 'أنظمة صيدلانية، بروتوكولات دوائية، إدارة مخزون' : 'Pharmacy Systems, Drug Interaction Databases'
      },
      marketing: {
        title: isAr ? 'مثال: أخصائي تسويق رقمي' : 'e.g. Digital Marketing Specialist',
        summary: isAr ? 'مثال: خبير تسويق رقمي متخصص في حملات الـ SEO وتحليل البيانات وإدارة منصات التواصل...' : 'e.g. Creative Marketing Specialist with proven results in SEO campaigns, social media growth, and ROI analytics...',
        skillCat: isAr ? 'مثال: التسويق الرقمي والتحليلات' : 'e.g. Digital Marketing & Analytics',
        skills: isAr ? 'التسويق الرقمي، حملات SEO/SEM، تحليلات جوجل، إدارة وسائل التواصل الاجتماعي، كتابة المحتوى، إعلانات الممول' : 'Digital Marketing, SEO/SEM, Google Analytics, Social Media Campaigns, Content Strategy, PPC Ads',
        degree: isAr ? 'مثال: بكالوريوس تسويق / إدارة أعمال' : 'e.g. Bachelor of Business Administration in Marketing',
        projName: isAr ? 'مثال: حملة إطلاق منتج جديد على المنصات' : 'e.g. New Product Launch Digital Campaign',
        projTech: isAr ? 'Google Analytics, Meta Ads, SEO Tools, HubSpot' : 'Google Analytics, Meta Ads, SEO Tools, HubSpot'
      },
      marketer: {
        title: isAr ? 'مثال: أخصائي تسويق رقمي' : 'e.g. Digital Marketing Specialist',
        summary: isAr ? 'مثال: خبير تسويق رقمي متخصص في حملات الـ SEO وتحليل البيانات وإدارة منصات التواصل...' : 'e.g. Creative Marketing Specialist with proven results in SEO campaigns, social media growth, and ROI analytics...',
        skillCat: isAr ? 'مثال: التسويق الرقمي والتحليلات' : 'e.g. Digital Marketing & Analytics',
        skills: isAr ? 'التسويق الرقمي، حملات SEO/SEM، تحليلات جوجل، إدارة وسائل التواصل الاجتماعي، كتابة المحتوى، إعلانات الممول' : 'Digital Marketing, SEO/SEM, Google Analytics, Social Media Campaigns, Content Strategy, PPC Ads',
        degree: isAr ? 'مثال: بكالوريوس تسويق / إدارة أعمال' : 'e.g. Bachelor of Business Administration in Marketing',
        projName: isAr ? 'مثال: حملة إطلاق منتج جديد على المنصات' : 'e.g. New Product Launch Digital Campaign',
        projTech: isAr ? 'Google Analytics, Meta Ads, SEO Tools, HubSpot' : 'Google Analytics, Meta Ads, SEO Tools, HubSpot'
      },
      sales: {
        title: isAr ? 'مثال: مدير مبيعات حسابات رئيسية' : 'e.g. Key Account Manager / Sales Executive',
        summary: isAr ? 'مثال: محترف مبيعات وتحقيق تارجت بخبرة في إدارة علاقات العملاء وإغلاق الصفقات الكبرى...' : 'e.g. Results-driven Sales Executive with strong track record in B2B sales, negotiation, and CRM management...',
        skillCat: isAr ? 'مثال: المبيعات وإدارة العملاء' : 'e.g. Sales & Account Management',
        skills: isAr ? 'إدارة علاقات العملاء (CRM)، مبيعات B2B، التفاوض، إغلاق الصفقات، خدمة العملاء، تحقيق التارجت' : 'CRM Management, B2B Sales, Negotiation, Deal Closing, Account Management, Target Achievement',
        degree: isAr ? 'مثال: بكالوريوس إدارة أعمال / تجارة' : 'e.g. Bachelor of Business Administration / Commerce',
        projName: isAr ? 'مثال: استراتيجية توسيع قاعدة عملاء الشركات' : 'e.g. Corporate Client Expansion Strategy',
        projTech: isAr ? 'Salesforce, CRM, KPI Tracking, B2B Sales' : 'Salesforce, CRM, KPI Tracking, B2B Sales'
      },
      hr: {
        title: isAr ? 'مثال: أخصائي موارد بشرية واستقطاب' : 'e.g. HR Generalist / Talent Acquisition Specialist',
        summary: isAr ? 'مثال: أخصائي موارد بشرية متميز في استقطاب الكفاءات وتطوير شؤون الموظفين وتقييم الأداء...' : 'e.g. Experienced HR Professional skilled in full-cycle recruitment, employee relations, and performance management...',
        skillCat: isAr ? 'مثال: الموارد البشرية والتوظيف' : 'e.g. Human Resources & Recruitment',
        skills: isAr ? 'استقطاب المواهب، إدارة الموارد البشرية، تقييم الأداء، شؤون الموظفين، المقابلات الشخصية، قانون العمل' : 'Talent Acquisition, HR Administration, Performance Management, Employee Relations, Labor Law',
        degree: isAr ? 'مثال: بكالوريوس إدارة موارد بشرية' : 'e.g. Bachelor of Business Administration in HR',
        projName: isAr ? 'مثال: إعادة هيكلة نظام تقييم الأداء والحوافز' : 'e.g. Employee Performance & Reward Restructuring',
        projTech: isAr ? 'HRIS, LinkedIn Recruiter, ERP, KPI Systems' : 'HRIS, LinkedIn Recruiter, ERP, KPI Systems'
      },
      civil_engineer: {
        title: isAr ? 'مثال: مهندس مدني / مدير مشروع' : 'e.g. Senior Civil Engineer / Site Manager',
        summary: isAr ? 'مثال: مهندس مدني ذو خبرة في إدارة المشاريع الإنشائية والتصميم وحساب الكميات...' : 'e.g. Professional Civil Engineer skilled in construction site management, structural design, and project planning...',
        skillCat: isAr ? 'مثال: الهندسة المدنية والإنشاءات' : 'e.g. Civil & Construction Engineering',
        skills: isAr ? 'أوتوكاد (AutoCAD)، إدارة المشاريع الإنشائية، التصميم الإنشائي، حساب الكميات، الموقع، Primavera P6' : 'AutoCAD, Construction Management, Structural Analysis, Quantity Surveying, Site Supervision, Primavera P6',
        degree: isAr ? 'مثال: بكالوريوس الهندسة المدنية' : 'e.g. Bachelor of Science in Civil Engineering',
        projName: isAr ? 'مثال: إنشاء وإشراف مجمع سكني تجاري' : 'e.g. Commercial & Residential Complex Construction',
        projTech: isAr ? 'AutoCAD, Primavera P6, Revit, Civil 3D' : 'AutoCAD, Primavera P6, Revit, Civil 3D'
      },
      mechanical_engineer: {
        title: isAr ? 'مثال: مهندس ميكانيكا / تكييف وحريق' : 'e.g. Mechanical Engineer / HVAC Specialist',
        summary: isAr ? 'مثال: مهندس ميكانيكا متخصص في تصميم أنظمة التكييف والحريق والصيانة الوقائية...' : 'e.g. Mechanical Engineer specializing in HVAC system design, preventive maintenance, and thermal analysis...',
        skillCat: isAr ? 'مثال: الهندسة الميكانيكية والتصميم' : 'e.g. Mechanical Design & Systems',
        skills: isAr ? 'التصميم الميكانيكي، SolidWorks، أنظمة التكييف (HVAC)، الصيانة الوقائية، الديناميكا الحرارية، AutoCAD MEP' : 'Mechanical Design, SolidWorks, HVAC Systems, Preventive Maintenance, Thermodynamics, AutoCAD MEP',
        degree: isAr ? 'مثال: بكالوريوس الهندسة الميكانيكية' : 'e.g. Bachelor of Science in Mechanical Engineering',
        projName: isAr ? 'مثال: تصميم وتنفيذ أنظمة التكييف لمبنى إداري' : 'e.g. HVAC & Fire Fighting System Design for Office Tower',
        projTech: isAr ? 'SolidWorks, AutoCAD MEP, Ansys, HVAC' : 'SolidWorks, AutoCAD MEP, Ansys, HVAC'
      },
      electrical_engineer: {
        title: isAr ? 'مثال: مهندس كهرباء وقوى' : 'e.g. Electrical Power Engineer / Automation Specialist',
        summary: isAr ? 'مثال: مهندس كهرباء ذو خبرة في تصميم شبكات القوى ولوحات التحكم وأنظمة الـ PLC...' : 'e.g. Electrical Engineer skilled in power systems design, control panels, and PLC automation...',
        skillCat: isAr ? 'مثال: الهندسة الكهربائية والتحكم' : 'e.g. Electrical Engineering & Automation',
        skills: isAr ? 'التصميم الكهربائي، لوحات التحكم، أنظمة القوى، برمجة PLC، التمديدات الكهربائية، ETAP، AutoCAD Electrical' : 'Electrical Design, Control Panels, Power Systems, PLC Programming, Wiring Diagrams, ETAP',
        degree: isAr ? 'مثال: بكالوريوس الهندسة الكهربائية' : 'e.g. Bachelor of Science in Electrical Engineering',
        projName: isAr ? 'مثال: تصميم وتمديد الشبكة الكهربائية لمصنع' : 'e.g. Industrial Plant Electrical Power Distribution Network',
        projTech: isAr ? 'AutoCAD Electrical, PLC, ETAP, SCADA' : 'AutoCAD Electrical, PLC, ETAP, SCADA'
      },
      graphic_designer: {
        title: isAr ? 'مثال: مصمم جرافيك وهويات بصرية' : 'e.g. Senior Graphic Designer / Brand Identity Specialist',
        summary: isAr ? 'مثال: مصمم جرافيك مبدع متخصص في تصميم الهويات البصرية، المطبوعات، ومحتوى السوشيال ميديا...' : 'e.g. Creative Graphic Designer with rich portfolio in brand identity, typography, and marketing visuals...',
        skillCat: isAr ? 'مثال: تصميم الجرافيك والهوية' : 'e.g. Graphic Design & Branding',
        skills: isAr ? 'فوتوشوب (Photoshop)، إليستريتور (Illustrator)، إن ديزاين (InDesign)، الهوية البصرية، تصميم المطبوعات' : 'Adobe Photoshop, Illustrator, InDesign, Brand Identity, Print Layouts, Typography, Color Theory',
        degree: isAr ? 'مثال: بكالوريوس الفنون التطبيقية / تصميم جرافيك' : 'e.g. Bachelor of Fine Arts in Graphic Design',
        projName: isAr ? 'مثال: تصميم الهوية البصرية الشاملة لشركة ناشئة' : 'e.g. Full Brand Identity & Visual Guideline for Tech Startup',
        projTech: isAr ? 'Photoshop, Illustrator, InDesign, Branding' : 'Photoshop, Illustrator, InDesign, Branding'
      },
      ui_ux_designer: {
        title: isAr ? 'مثال: مصمم تجربة وواجهات مستخدم (UI/UX)' : 'e.g. Senior UI/UX Designer / Product Designer',
        summary: isAr ? 'مثال: مصمم UI/UX متخصص في بحث سلوك المستخدم وتصميم واجهات تفاعلية سلسة على Figma...' : 'e.g. Passionate UI/UX Designer specialized in user research, wireframing, and creating intuitive Figma prototypes...',
        skillCat: isAr ? 'مثال: تصميم واجهات وتجربة المستخدم' : 'e.g. UI/UX Design & Research',
        skills: isAr ? 'فيجما (Figma)، تصميم واجهات المستخدم (UI)، تجربة المستخدم (UX)، النماذج التفاعلية، Wireframing، أبحاث المستخدمين' : 'Figma, UI Design, UX Research, Prototyping, Wireframing, Usability Testing, Design Systems',
        degree: isAr ? 'مثال: بكالوريوس تصميم رقمي / علوم حاسب' : 'e.g. Bachelor of Design / Human-Computer Interaction',
        projName: isAr ? 'مثال: إعادة تصميم واجهة تطبيق مصرفي للهواتف' : 'e.g. Mobile Banking App UX Research & UI Redesign',
        projTech: isAr ? 'Figma, Design Systems, Prototyping, Usability Testing' : 'Figma, Design Systems, Prototyping, Usability Testing'
      },
      architect: {
        title: isAr ? 'مثال: مهندس معماري وتصميم داخلي' : 'e.g. Senior Architect / Interior Design Specialist',
        summary: isAr ? 'مثال: مهندس معماري متميز بخبرة في التصميم المستدام وتخطيط المساحات وإعداد المخططات التنفيذية...' : 'e.g. Creative Architect skilled in architectural concepts, interior planning, and 3D visualization using Revit and AutoCAD...',
        skillCat: isAr ? 'مثال: التصميم المعماري والتخطيط' : 'e.g. Architectural Design & Planning',
        skills: isAr ? 'التصميم المعماري، أوتوكاد (AutoCAD)، الريفيت (Revit)، 3ds Max، التخطيط العمراني، كود البناء، Lumion' : 'Architectural Design, AutoCAD, Revit, 3D Modeling, Urban Planning, Building Codes, Lumion, SketchUp',
        degree: isAr ? 'مثال: بكالوريوس الهندسة المعمارية' : 'e.g. Bachelor of Architecture (B.Arch)',
        projName: isAr ? 'مثال: التصميم المعماري وتخطيط منتجع سياحي مستدام' : 'e.g. Sustainable Eco-Resort Architectural Design & Master Plan',
        projTech: isAr ? 'AutoCAD, Revit, 3ds Max, Lumion, BIM' : 'AutoCAD, Revit, 3ds Max, Lumion, BIM'
      },
      customer_service: {
        title: isAr ? 'مثال: أخصائي خدمة عملاء ودعم فني' : 'e.g. Customer Service Representative / Support Lead',
        summary: isAr ? 'مثال: أخصائي خدمة عملاء متميز بالصبر والقدرة على حل المشكلات وإدارة المكالمات وتحقيق رضا العملاء...' : 'e.g. Customer-centric Support Specialist skilled in active listening, ticket resolution, and CRM administration...',
        skillCat: isAr ? 'مثال: خدمة ورضا العملاء' : 'e.g. Customer Support & Success',
        skills: isAr ? 'حل مشاكل العملاء، التواصل الفعال، إدارة المكالمات والشكاوى، أنظمة CRM، الصبر والتعاطف، سرعة الاستجابة' : 'Customer Support, Conflict Resolution, Effective Communication, CRM Software, Ticket Management, Empathy',
        degree: isAr ? 'مثال: بكالوريوس آداب / إدارة أعمال' : 'e.g. Bachelor of Arts / Business Administration',
        projName: isAr ? 'مثال: تحسين معدل رضا العملاء وتقليل زمن الحل' : 'e.g. Customer Satisfaction (CSAT) Improvement & Ticket Reduction',
        projTech: isAr ? 'Zendesk, Salesforce CRM, Call Center Systems' : 'Zendesk, Salesforce CRM, Call Center Systems'
      },
      data_analyst: {
        title: isAr ? 'مثال: محلل بيانات وذكاء أعمال (BI)' : 'e.g. Data Analyst / Business Intelligence Specialist',
        summary: isAr ? 'مثال: محلل بيانات محترف في استخراج الرؤى من قواعد البيانات وبناء لوحات تفاعلية على Power BI...' : 'e.g. Analytical Data Specialist skilled in SQL queries, statistical modeling, and interactive Power BI dashboards...',
        skillCat: isAr ? 'مثال: تحليل البيانات والإحصاء' : 'e.g. Data Analysis & BI',
        skills: isAr ? 'تحليل البيانات، SQL، إكسل المتقدم، Tableau، Power BI، النمذجة الإحصائية، Python، تنظيف البيانات' : 'Data Analysis, SQL, Advanced Excel, Tableau, Power BI, Statistical Modeling, Python, Data Cleaning',
        degree: isAr ? 'مثال: بكالوريوس علوم حاسب / إحصاء' : 'e.g. Bachelor of Science in Computer Science / Statistics',
        projName: isAr ? 'مثال: لوحة تحليل المبيعات وتوقع الطلب التفاعلية' : 'e.g. Interactive Sales Analytics & Demand Forecasting Dashboard',
        projTech: isAr ? 'SQL, Power BI, Advanced Excel, Python' : 'SQL, Power BI, Advanced Excel, Python'
      },
      project_manager: {
        title: isAr ? 'مثال: مدير مشاريع معتمد (PMP)' : 'e.g. Certified Project Manager (PMP) / Agile Coach',
        summary: isAr ? 'مثال: مدير مشاريع معتمد بخبرة قيادية في تطبيق منهجيات Agile وScrum وتخطيط الميزانيات...' : 'e.g. Accomplished Project Manager with proven success delivering complex projects on time and budget using Agile & PMP practices...',
        skillCat: isAr ? 'مثال: إدارة المشاريع والقيادة' : 'e.g. Project Management & Leadership',
        skills: isAr ? 'إدارة المشاريع، PMP، أجايل (Agile)، سكروم (Scrum)، تخطيط الميزانية، قيادة الفريق، إدارة المخاطر، Jira' : 'Project Management, PMP, Agile Methodology, Scrum, Budget Allocation, Team Leadership, Risk Management, Jira',
        degree: isAr ? 'مثال: بكالوريوس إدارة أعمال / هندسة + شهادة PMP' : 'e.g. B.Sc / BBA + PMP Certification',
        projName: isAr ? 'مثال: قيادة وإدارة مشروع التحول الرقمي للمؤسسة' : 'e.g. Enterprise Digital Transformation Project Delivery',
        projTech: isAr ? 'Jira, MS Project, Agile, Scrum, PMP Framework' : 'Jira, MS Project, Agile, Scrum, PMP Framework'
      },
      business_analyst: {
        title: isAr ? 'مثال: محلل أعمال وتطوير أنظمة' : 'e.g. Senior Business Analyst / Product Owner',
        summary: isAr ? 'مثال: محلل أعمال خبير في جمع المتطلبات ونمذجة العمليات التجارية وتحليل الفجوات وسير العمل...' : 'e.g. Detail-oriented Business Analyst skilled in requirement gathering, process modeling, and bridging business and tech teams...',
        skillCat: isAr ? 'مثال: تحليل وتطوير الأعمال' : 'e.g. Business Analysis & Process Modeling',
        skills: isAr ? 'تحليل الأعمال، جمع المتطلبات، نمذجة العمليات (BPMN)، تحليل الفجوات، دراسات الجدوى، كتابة قاصص المستخدمين (User Stories)' : 'Business Analysis, Requirement Gathering, Process Modeling, Gap Analysis, Feasibility Studies, User Stories, Jira',
        degree: isAr ? 'مثال: بكالوريوس نظم معلومات إدارية / إدارة أعمال' : 'e.g. Bachelor of Science in MIS / Business Administration',
        projName: isAr ? 'مثال: تحليل وتطوير سير عمل نظام تخطيط الموارد (ERP)' : 'e.g. Enterprise ERP Workflow Optimization & Process Mapping',
        projTech: isAr ? 'BPMN, Jira, Visio, Gap Analysis, Agile' : 'BPMN, Jira, Visio, Gap Analysis, Agile'
      },
      speech_therapist: {
        title: isAr ? 'مثال: أخصائي تخاطب وتأهيل نطق' : 'e.g. Speech-Language Pathologist / Therapist',
        summary: isAr ? 'مثال: أخصائي تخاطب ذو خبرة في تقييم وعلاج اضطرابات النطق واللغة لدى الأطفال والبالغين...' : 'e.g. Dedicated Speech-Language Pathologist experienced in diagnosing and treating communication and swallowing disorders...',
        skillCat: isAr ? 'مثال: علاج التخاطب والنطق' : 'e.g. Speech & Language Therapy',
        skills: isAr ? 'تقييم النطق، علاج التخاطب، خطط التأهيل، اضطرابات اللغة والتوحد، جلسات النطق للأطفال، اضطرابات البلع' : 'Speech Assessment, Articulation Therapy, Rehabilitation Plans, Language Disorders, Pediatric Therapy, Autism Intervention',
        degree: isAr ? 'مثال: بكالوريوس علوم التأهيل / تخاطب ونطق' : 'e.g. Bachelor of Science in Speech-Language Pathology',
        projName: isAr ? 'مثال: برنامج تأهيل النطق واللغة المبكر للأطفال' : 'e.g. Early Pediatric Speech & Language Rehabilitation Program',
        projTech: isAr ? 'أدوات تقييم نطق، برامج تأهيلية، جلسات تفاعلية' : 'Speech Assessment Tools, Therapy Protocols'
      },
      developer: {
        title: isAr ? 'مثال: مهندس برمجيات / مطور ويب' : 'e.g. Software Engineer / Web Developer',
        summary: isAr ? 'مثال: مطور برمجيات بخبرة 3+ سنوات في بناء وتطوير تطبيقات الويب المتجاوبة وقواعد البيانات...' : 'e.g. Software Developer with 3+ years of experience building scalable web applications and RESTful APIs...',
        skillCat: isAr ? 'مثال: تطوير الويب والبرمجيات' : 'e.g. Web & Software Development',
        skills: isAr ? 'جافا سكريبت، رياكت، نود جي إس، قواعد البيانات (SQL)، Git، TypeScript، وبناء واجهات مستخدم' : 'JavaScript, React, Node.js, SQL, Git, TypeScript, RESTful APIs',
        degree: isAr ? 'مثال: بكالوريوس حاسبات ومعلومات / هندسة برمجيات' : 'e.g. Bachelor of Science in Computer Science / Software Engineering',
        projName: isAr ? 'مثال: تطوير منصة حجز ومتابعة متجاوبة' : 'e.g. Responsive E-Commerce & Appointment Booking Platform',
        projTech: isAr ? 'React, Node.js, MongoDB, REST API, Git' : 'React, Node.js, MongoDB, REST API, Git'
      },
      designer: {
        title: isAr ? 'مثال: مصمم جرافيك وتجربة مستخدم' : 'e.g. Graphic & UI/UX Designer',
        summary: isAr ? 'مثال: مصمم مبدع ذو خبرة في تصميم الهويات البصرية وواجهات المستخدم على Figma وAdobe...' : 'e.g. Versatile Designer experienced in brand identity, marketing collateral, and UI/UX prototyping...',
        skillCat: isAr ? 'مثال: التصميم الرقمي والجرافيك' : 'e.g. Digital & UI Design',
        skills: isAr ? 'فوتوشوب، إليستريتور، فيجما، تصميم واجهات المستخدم، الهوية البصرية، أبحاث المستخدمين' : 'Photoshop, Illustrator, Figma, UI/UX Design, Branding, Prototyping',
        degree: isAr ? 'مثال: بكالوريوس الفنون التطبيقية / تصميم رقمي' : 'e.g. Bachelor of Fine Arts in Graphic / Digital Design',
        projName: isAr ? 'مثال: تصميم الهوية البصرية وواجهة تطبيق الجوال' : 'e.g. Complete Brand Identity & Mobile App UI Prototyping',
        projTech: isAr ? 'Figma, Photoshop, Illustrator, Design System' : 'Figma, Photoshop, Illustrator, Design System'
      }
    };

    const def = map.developer;
    return map[field] || def;
  }

  const exportObj = { normalize, createEmpty, normalizeProject, getProfessionPlaceholders };
  if (typeof window !== 'undefined') {
    window.getProfessionPlaceholders = getProfessionPlaceholders;
  }
  return exportObj;
})();

if (typeof module !== 'undefined') module.exports = CareerNormalize;
