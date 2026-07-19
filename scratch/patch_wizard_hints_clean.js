const fs = require('fs');
let s = fs.readFileSync('app/assets/wizard.js', 'utf8').replace(/\r\n/g, '\n');

// 1. Insert helperFunctions before skipExperienceFresh if not already present
const helperFunctions = `  function fillStepInput(inputId, val, stateKey) {
    const elInput = el(inputId);
    if (elInput) {
      elInput.value = val;
      if (stateKey === 'experience') {
        if (!career.experience || !career.experience.length) career.experience = [{ role: '', company: '', period: '', bullets: [] }];
        career.experience[0].role = val;
      } else if (stateKey === 'projects') {
        if (!career.projects || !career.projects.length) career.projects = [{ name: '', description: '' }];
        career.projects[0].name = val;
      } else if (stateKey === 'education') {
        if (!career.education || !career.education.length) career.education = [{ degree: '', school: '', year: '' }];
        career.education[0].degree = val;
      }
      elInput.focus();
    }
  }

  function getStepHintBox(step, curField, isAr, level) {
    const fieldTitles = {
      developer: isAr ? 'تطوير البرمجيات' : 'Software Engineering',
      teacher: isAr ? 'التعليم والتدريس' : 'Teaching & Education',
      accountant: isAr ? 'المحاسبة والمالية' : 'Accounting & Finance',
      doctor: isAr ? 'الطب والرعاية الصحية' : 'Medicine & Healthcare',
      dentist: isAr ? 'طب الأسنان' : 'Dentistry',
      pharmacist: isAr ? 'الصيدلة' : 'Pharmacy',
      nurse: isAr ? 'التمريض والرعاية' : 'Nursing',
      lawyer: isAr ? 'القانون والمحاماة' : 'Legal & Law',
      hr: isAr ? 'الموارد البشرية (HR)' : 'Human Resources',
      marketing: isAr ? 'التسويق الرقمي وإدارة الحملات' : 'Marketing',
      sales: isAr ? 'المبيعات وتطوير الأعمال' : 'Sales & Business Dev',
      customer_service: isAr ? 'خدمة العملاء والدعم' : 'Customer Service',
      graphic_designer: isAr ? 'التصميم الجرافيكي' : 'Graphic Design',
      ui_ux_designer: isAr ? 'تصميم تجربة ومستخدم (UI/UX)' : 'UI/UX Design',
      architect: isAr ? 'الهندسة المعمارية والتصميم' : 'Architecture',
      civil_engineer: isAr ? 'الهندسة المدنية والإنشاءات' : 'Civil Engineering',
      mechanical_engineer: isAr ? 'الهندسة الميكانيكية' : 'Mechanical Engineering',
      electrical_engineer: isAr ? 'الهندسة الكهربائية' : 'Electrical Engineering',
      data_analyst: isAr ? 'تحليل البيانات وذكاء الأعمال' : 'Data Analysis'
    };
    const fName = fieldTitles[curField] || (isAr ? 'مجالك المهني' : 'your field');

    if (step === 'experience') {
      const quickChips = {
        accountant: isAr ? ['محاسب مالي في شركة...', 'متدرب حسابات ومراجعة في...', 'محاسب تكاليف وميزانيات'] : ['Financial Accountant at...', 'Accounting Intern at...', 'Tax & Audit Associate'],
        developer: isAr ? ['مطور واجهات أمامية Frontend في...', 'مطور برمجيات متدرب في...', 'مطور ويب مستقل (Freelance)'] : ['Frontend Developer at...', 'Software Engineering Intern', 'Full Stack Freelancer'],
        teacher: isAr ? ['معلم مرحلة... في مدرسة...', 'مدرس ومطور مناهج تفاعلية', 'متدرب تدريس وإشراف تربوي'] : ['Teacher at...', 'Curriculum Developer', 'Education Intern'],
        sales: isAr ? ['أخصائي مبيعات وعلاقات عملاء في...', 'مندوب مبيعات كبار العملاء', 'متدرب تطوير أعمال ومبيعات'] : ['Sales Representative at...', 'Account Executive', 'Sales Intern'],
        marketing: isAr ? ['أخصائي تسويق رقمي وإدارة حملات', 'صانع محتوى وسوشيال ميديا في...', 'متدرب تسويق وتحليل أداء'] : ['Digital Marketing Specialist at...', 'Content Marketer', 'Marketing Intern'],
        customer_service: isAr ? ['ممثل خدمة عملاء ودعم فني في...', 'أخصائي تجربة عملاء', 'متدرب كول سنتر ودعم'] : ['Customer Service Representative at...', 'Technical Support Specialist', 'CS Intern'],
        graphic_designer: isAr ? ['مصمم جرافيك وهوية بصرية في...', 'مصمم وسائط ومحتوى رقمي حر', 'متدرب تصميم جرافيك'] : ['Graphic Designer at...', 'Visual Identity Freelancer', 'Design Intern'],
        ui_ux_designer: isAr ? ['مصمم تجربة ومستخدم UI/UX في...', 'متدرب تصميم واجهات وتطبيقات', 'مصمم منتجات رقمية حر'] : ['UI/UX Designer at...', 'Product Design Intern', 'Freelance UX Researcher'],
        hr: isAr ? ['أخصائي موارد بشرية وتوظيف في...', 'مسؤول شؤون عاملين ورواتب', 'متدرب موارد بشرية واستقطاب'] : ['HR Specialist at...', 'Talent Acquisition Coordinator', 'HR Intern'],
        doctor: isAr ? ['طبيب مقيم في مستشفى...', 'طبيب عام ومكافحة عدوى', 'متدرب امتياز بالمستشفيات الجامعية'] : ['Resident Physician at...', 'General Practitioner', 'Medical Intern'],
        pharmacist: isAr ? ['صيدلي إكلينيكي في مستشفى/صيدلية...', 'أخصائي معلومات دوائية وجرد', 'متدرب صيدلة ومبيعات طبية'] : ['Clinical Pharmacist at...', 'Community Pharmacist', 'Pharmacy Intern'],
        lawyer: isAr ? ['محامٍ ومستشار قانوني في...', 'باحث وصائغ عقود قانونية', 'متدرب شؤون قانونية وقضايا'] : ['Legal Counsel at...', 'Associate Attorney', 'Legal Intern'],
        civil_engineer: isAr ? ['مهندس مدني وتطوير موقع في...', 'مهندس مكتب فني وحصر كميات', 'متدرب هندسة مدنية وإنشاءات'] : ['Civil Engineer at...', 'Site Engineer', 'Civil Engineering Intern'],
        data_analyst: isAr ? ['محلل بيانات وتطوير تقارير BI في...', 'أخصائي تحليل وقواعد بيانات', 'متدرب علم وتحليل بيانات'] : ['Data Analyst at...', 'BI Developer', 'Data Analysis Intern']
      };
      const chips = quickChips[curField] || (isAr ? ['أخصائي أول في شركة...', 'متدرب في قسم...', 'عمل حر ومشاريع عملية'] : ['Specialist at...', 'Intern at...', 'Freelance Consultant']);

      return \`
        <div style="margin-top:20px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-\${isAr ? 'right' : 'left'}:4px solid #2563eb;border-radius:12px;font-size:13px;line-height:1.7;color:#334155;text-align:\${isAr ? 'right' : 'left'};">
          <div style="font-weight:800;color:#0f172a;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <span style="font-size:18px;">💡</span> <span>\${isAr ? 'تلميحات هامة لكتابة خبرتك بقوة وسهولة:' : 'Pro Tips for Writing Your Experience:'}</span>
          </div>
          <ul style="margin:0;padding-\${isAr ? 'right' : 'left'}:20px;list-style-type:disc;color:#475569;">
            <li style="margin-bottom:6px;"><strong>\${isAr ? 'التدريب والمشاريع العملية والأعمال الحرة يُحسبوا' : 'Internships, practical projects & freelancing count'}</strong> \${isAr ? 'كخبرة حقيقية في سيرتك، لا تتردد في كتابتهم إذا كنت في بداية مسيرتك.' : 'as real experience! Don’t hesitate to list them.'}</li>
            <li style="margin-bottom:6px;">\${isAr ? 'في مجال' : 'In'} <strong>\${fName}</strong>، \${isAr ? 'الجملة القوية لازم تبين <strong>فعل وإنجاز أو نتيجة</strong> (مثلاً: قمت بتطوير/إدارة/تحسين... مما أدى إلى...).' : 'a strong bullet must show <strong>action + measurable result</strong> (e.g. Developed/Managed... resulting in...).'}</li>
          </ul>
          <div style="margin-top:14px;font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px;">\${isAr ? '⚡ اضغط على أي مثال لبدء التعبئة فوراً:' : '⚡ Click any hint to quick-fill:'}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            \${chips.map(ch => \`<button type="button" onclick="Wizard.fillStepInput('wz-input-exp', '\${h(ch)}', 'experience')" style="padding:6px 12px;background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;font-weight:600;color:#2563eb;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#eff6ff'" onmouseout="this.style.background='#fff'">+ \${h(ch)}</button>\`).join('')}
          </div>
        </div>
      \`;
    }

    if (step === 'projects') {
      const quickProj = {
        developer: isAr ? ['تطبيق إدارة مهام ومبيعات متكامل', 'موقع تجارة إلكترونية كامل وتفاعلي', 'نظام API وتوثيق بيانات باستخدام Node/Python'] : ['E-Commerce Web Application', 'Task Management Dashboard', 'RESTful API Platform'],
        teacher: isAr ? ['تصميم منهج وأنشطة تفاعلية لطلاب المرحلة...', 'مبادرة تحسين مهارات القراءة والاستيعاب', 'تطبيق استراتيجية التعلم النشط والفصول المقلوبة'] : ['Interactive Curriculum Design Project', 'Student Literacy & Reading Program', 'Active Learning & Gamification Workshop'],
        accountant: isAr ? ['بناء نموذج تحليل مالي وتوقعات على Excel/Power BI', 'دراسة جدوى وميزانية تقديرية لمشروع ناشئ', 'تطوير نظام أرشفة وضبط دورة المستندات المالية'] : ['Financial Dashboard & Forecasting Model', 'Startup Budget & Feasibility Analysis', 'Document Flow & Auditing Optimization Project']
      };
      const chips = quickProj[curField] || (isAr ? ['مشروع تخرج / بحث تطبيقي مميز', 'مبادرة تحسين الأداء وتطوير العمليات', 'مشروع عملي أو دراسة حالة واقعية'] : ['Graduation Applied Research Project', 'Process Optimization Initiative', 'Real-world Case Study Project']);
      return \`
        <div style="margin-top:20px;padding:16px;background:#f8fafc;border:1px solid #e2e8f0;border-\${isAr ? 'right' : 'left'}:4px solid #10b981;border-radius:12px;font-size:13px;line-height:1.7;color:#334155;text-align:\${isAr ? 'right' : 'left'};">
          <div style="font-weight:800;color:#0f172a;margin-bottom:8px;display:flex;align-items:center;gap:6px;">
            <span style="font-size:18px;">💡</span> <span>\${isAr ? 'تلميح: المشاريع العملية هي إثباتك الأقوى!' : 'Pro Tip: Projects prove your practical value!'}</span>
          </div>
          <div style="color:#475569;margin-bottom:10px;">\${isAr ? \`في مجال <strong>\${fName}</strong>، أصحاب العمل يهتمون جداً برؤية مشاريعك وتطبيقاتك الحية. اذكر اسم المشروع أو المبادرة التي شاركت بها.\` : \`In <strong>\${fName}</strong>, employers love seeing practical output. List the name of your key project or initiative.\`}</div>
          <div style="font-size:12px;font-weight:700;color:#64748b;margin-bottom:8px;">\${isAr ? '⚡ اضغط لاختيار وتعبئة مثال مشروع:' : '⚡ Click to quick-fill a project example:'}</div>
          <div style="display:flex;flex-wrap:wrap;gap:8px;">
            \${chips.map(ch => \`<button type="button" onclick="Wizard.fillStepInput('wz-input-proj', '\${h(ch)}', 'projects')" style="padding:6px 12px;background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;font-weight:600;color:#10b981;cursor:pointer;transition:all 0.15s;" onmouseover="this.style.background='#ecfdf5'" onmouseout="this.style.background='#fff'">+ \${h(ch)}</button>\`).join('')}
          </div>
        </div>
      \`;
    }

    if (step === 'education') {
      const chips = isAr ? ['بكالوريوس تجارة / إدارة أعمال - جامعة...', 'بكالوريوس علوم حاسب / هندسة برمجيات - جامعة...', 'بكالوريوس تربية / آداب - جامعة...', 'دبلومة متخصصة / شهادة مهنية عالية'] : ['Bachelor of Business Administration — University of...', 'Bachelor of Computer Science / Engineering', 'Bachelor of Education / Arts', 'Professional Diploma / Certified Specialist'];
      return \`
        <div style="margin-top:20px;padding:14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;font-size:13px;color:#475569;text-align:\${isAr ? 'right' : 'left'};">
          <div style="font-weight:700;color:#0f172a;margin-bottom:6px;display:flex;align-items:center;gap:6px;">
            <span>🎓</span> <span>\${isAr ? 'تلميح سريع لكتابة المؤهل:' : 'Quick tip for Education:'}</span>
          </div>
          <div>\${isAr ? 'اذكر أعلى مؤهل دراسي حصلت عليه مع اسم الجامعة أو المعهد وسنة التخرج.' : 'List your highest qualification along with university and graduation year.'}</div>
          <div style="margin-top:10px;display:flex;flex-wrap:wrap;gap:8px;">
            \${chips.map(ch => \`<button type="button" onclick="Wizard.fillStepInput('wz-input-edu', '\${h(ch)}', 'education')" style="padding:4px 10px;background:#fff;border:1px solid #cbd5e1;border-radius:6px;font-size:12px;color:#475569;cursor:pointer;">+ \${h(ch)}</button>\`).join('')}
          </div>
        </div>
      \`;
    }

    return '';
  }

  function skipExperienceFresh() {`;

if (!s.includes('function getStepHintBox(')) {
  s = s.replace('  function skipExperienceFresh() {', helperFunctions);
  console.log('Injected helperFunctions');
}

// 2. Replace education step
s = s.replace(/case 'education':\s+html = `[\s\S]*?`;\s+setTimeout\(\(\) => bindLiveInput\('wz-input-edu', 'education', '', false\), 0\);\s+break;/g,
`case 'education':
        html = \`
          <h1 class="wz-title">\${t('wz.stepEdu')}</h1>
          <input type="text" id="wz-input-edu" class="wz-input-huge" placeholder="\${phObj.degree || t('wz.stepEduPh')}" value="\${a(career.education?.[0]?.degree || '')}" autofocus>
          \${getStepHintBox('education', curField, career.meta?.locale === 'ar', career.careerProfile?.level)}
        \`;
        setTimeout(() => bindLiveInput('wz-input-edu', 'education', '', false), 0);
        break;`);

// 3. Replace experience step
s = s.replace(/case 'experience':\s+html = `[\s\S]*?`;\s+setTimeout\(\(\) => bindLiveInput\('wz-input-exp', 'experience', '', false\), 0\);\s+btn\.innerText = t\('wz\.skip'\);\s+break;/g,
`case 'experience':
        html = \`
          <h1 class="wz-title">\${t('wz.stepExp')}</h1>
          <input type="text" id="wz-input-exp" class="wz-input-huge" placeholder="\${phObj.title || t('wz.stepExpPh')}" value="\${a(career.experience?.[0]?.role || '')}" autofocus>
          \${career.careerProfile?.level === 'fresh' ? \`
            <div style="margin-top:20px;">
              <button type="button" class="wz-option-btn" style="border: 1.5px solid var(--primary,#2563eb);color:var(--primary,#2563eb);width:100%;text-align:center;font-weight:600;padding:12px;" onclick="Wizard.skipExperienceFresh()">
                🎯 \${career.meta?.locale === 'ar' ? 'تخطي - أنا حديث التخرج وليس لدي خبرة سابقة' : 'Skip — I am a Fresh Graduate with no experience'}
              </button>
            </div>
          \` : ''}
          \${getStepHintBox('experience', curField, career.meta?.locale === 'ar', career.careerProfile?.level)}
        \`;
        setTimeout(() => bindLiveInput('wz-input-exp', 'experience', '', false), 0);
        btn.innerText = t('wz.skip');
        break;`);

// 4. Replace projects step
s = s.replace(/case 'projects':\s+html = `[\s\S]*?`;\s+setTimeout\(\(\) => bindLiveInput\('wz-input-proj', 'projects', '', false\), 0\);\s+btn\.innerText = t\('wz\.skip'\);\s+break;/g,
`case 'projects':
        html = \`
          <div class="wz-encouragement">\${t('wz.msgFewMore')}</div>
          <h1 class="wz-title">\${t('wz.stepProj')}</h1>
          <input type="text" id="wz-input-proj" class="wz-input-huge" placeholder="\${phObj.projName || t('wz.stepProjPh')}" value="\${a(career.projects?.[0]?.name || '')}" autofocus>
          \${getStepHintBox('projects', curField, career.meta?.locale === 'ar', career.careerProfile?.level)}
        \`;
        setTimeout(() => bindLiveInput('wz-input-proj', 'projects', '', false), 0);
        btn.innerText = t('wz.skip');
        break;`);

// 5. Export fillStepInput
if (!s.includes('fillStepInput,')) {
  s = s.replace('skipExperienceFresh, prevStep: handlePrev', 'skipExperienceFresh, fillStepInput, prevStep: handlePrev');
  console.log('Exported fillStepInput');
}

fs.writeFileSync('app/assets/wizard.js', s, 'utf8');
console.log('Regex patch complete.');
