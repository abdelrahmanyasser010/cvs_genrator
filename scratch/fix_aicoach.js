const fs = require('fs');
let s = fs.readFileSync('coach/ai-coach.js', 'utf8');

const startMarker = 'const ACTION_VERBS = [';
const endMarker = 'function analyzeWizardInput(';

const startIdx = s.indexOf(startMarker);
const endIdx = s.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const cleanBlock = `const ACTION_VERBS = ['Built', 'Improved', 'Managed', 'Delivered', 'Designed', 'Implemented', 'Optimized', 'Led'];

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
    return String(text || '').trim().split(/\\s+/).filter(Boolean).length;
  }

  function hasMetric(text) {
    return /\\d|%|\\b(kpi|revenue|cost|users|students|clients|sales|time|hours|days|growth)\\b/i.test(text || '');
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
        body: tr(career, \`For \${area}, strong bullets should show action plus result.\`, \`في مجال \${area}، الجملة القوية لازم تبين فعل ونتيجة.\`)
      },
      projects: {
        title: tr(career, 'A project can rescue a thin CV.', 'المشروع القوي ممكن يرفع CV ضعيف.'),
        body: tr(career, 'Mention what you built, who it helped, and the tools used.', 'اكتب بنيت إيه، فاد مين، واستخدمت أدوات إيه.')
      },
      skills: {
        title: tr(career, 'Aim for focused skills, not a long list.', 'استهدف مهارات مركزة، مش قائمة طويلة.'),
        body: tr(career, \`For \${area}, 8-12 relevant skills is usually enough.\`, \`في مجال \${area}، من 8 إلى 12 مهارة مناسبة غالبًا كفاية.\`)
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

  `;
  s = s.substring(0, startIdx) + cleanBlock + s.substring(endIdx);
  fs.writeFileSync('coach/ai-coach.js', s, 'utf8');
  console.log('Successfully updated ai-coach.js');
} else {
  console.log('Markers not found', startIdx, endIdx);
}
