/**
 * Offline Helpers — Knowledge-based suggestions without AI
 * 
 * These helpers use the Knowledge Base to provide intelligent suggestions
 * without requiring any API calls. This ensures the product works fully offline.
 * 
 * Examples:
 * - Flutter → Suggest Bloc, Dio, Hive, Firebase, REST API
 * - Accountant → Suggest Excel, ERP, QuickBooks, VAT, Financial Reports
 * - Teacher → Suggest Curriculum design, Classroom management, Assessment
 */

const OfflineHelpers = (function () {
  // Knowledge-based skill suggestions
  const skillMappings = {
    developer: {
      flutter: ['Bloc', 'Provider', 'GetX', 'Dio', 'Hive', 'Drift', 'Firebase', 'REST API', 'Google Maps', 'State Management'],
      android: ['Kotlin', 'Jetpack Compose', 'Room', 'Retrofit', 'Coroutines', 'MVVM', 'Gradle', 'Material Design'],
      frontend: ['React', 'Vue.js', 'TypeScript', 'Tailwind CSS', 'Webpack', 'Redux', 'Next.js', 'GraphQL'],
      backend: ['Node.js', 'Express', 'PostgreSQL', 'MongoDB', 'Docker', 'Redis', 'REST API', 'GraphQL'],
      fullstack: ['React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Docker', 'REST API', 'Git', 'CI/CD'],
      ai: ['Python', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Jupyter', 'Machine Learning', 'Deep Learning', 'NLP']
    },
    accountant: {
      tax: ['Excel', 'Tax Preparation', 'IRS Regulations', 'Tax Software', 'Financial Reporting', 'Compliance'],
      audit: ['Internal Audit', 'Risk Assessment', 'GAAP', 'Sarbanes-Oxley', 'Financial Analysis', 'Compliance'],
      financial: ['Financial Planning', 'Budget Management', 'Forecasting', 'Excel', 'Financial Modeling', 'KPI Analysis']
    },
    teacher: {
      primary: ['Curriculum Design', 'Classroom Management', 'Child Development', 'Assessment', 'Special Education', 'Parent Communication'],
      secondary: ['Subject Expertise', 'Student Engagement', 'Exam Preparation', 'Mentoring', 'Technology Integration', 'Differentiated Instruction'],
      university: ['Research', 'Academic Writing', 'Curriculum Development', 'Student Supervision', 'Grant Writing', 'Publication']
    },
    designer: {
      ui: ['Figma', 'Adobe XD', 'Sketch', 'Design Systems', 'User Research', 'Prototyping', 'Wireframing'],
      ux: ['User Research', 'Usability Testing', 'Information Architecture', 'Journey Mapping', 'Personas', 'A/B Testing'],
      branding: ['Brand Strategy', 'Logo Design', 'Visual Identity', 'Typography', 'Color Theory', 'Brand Guidelines'],
      print: ['Adobe Illustrator', 'InDesign', 'Print Design', 'Typography', 'Layout', 'Prepress']
    },
    marketing: {
      digital: ['SEO', 'Google Ads', 'Social Media Marketing', 'Email Marketing', 'Analytics', 'Content Marketing'],
      content: ['Copywriting', 'Content Strategy', 'Blog Writing', 'Social Media Content', 'Video Scripting', 'Storytelling'],
      social: ['Instagram', 'LinkedIn', 'Twitter', 'Facebook', 'TikTok', 'Community Management', 'Influencer Marketing'],
      seo: ['Keyword Research', 'On-page SEO', 'Technical SEO', 'Link Building', 'Analytics', 'Local SEO']
    },
    doctor: {
      general: ['Patient Care', 'Diagnosis', 'Treatment Planning', 'Medical Records', 'EMR Systems', 'Patient Communication'],
      specialist: ['Specialized Diagnosis', 'Advanced Treatment', 'Medical Research', 'Consultation', 'Patient Education'],
      surgeon: ['Surgical Procedures', 'Operating Room Protocols', 'Patient Assessment', 'Post-operative Care', 'Surgical Technology']
    },
    engineer: {
      civil: ['AutoCAD', 'Structural Analysis', 'Project Management', 'Construction', 'Site Supervision', 'Building Codes'],
      mechanical: ['CAD', 'Product Design', 'Manufacturing', 'Thermodynamics', 'Materials Science', 'Prototyping'],
      electrical: ['Circuit Design', 'Power Systems', 'PLC Programming', 'Electrical Safety', 'Testing', 'Troubleshooting'],
      software: ['Programming', 'Software Architecture', 'Agile', 'Git', 'Testing', 'DevOps']
    },
    hr: {
      recruiting: ['Talent Acquisition', 'Interviewing', 'ATS Systems', 'Sourcing', 'Employer Branding', 'Onboarding'],
      training: ['Training Development', 'Learning Management', 'Performance Management', 'Coaching', 'Skill Development'],
      compensation: ['Salary Benchmarking', 'Benefits Administration', 'Payroll', 'Compensation Analysis', 'HR Analytics']
    },
    lawyer: {
      corporate: ['Contract Law', 'Corporate Governance', 'Mergers & Acquisitions', 'Compliance', 'Legal Research', 'Due Diligence'],
      criminal: ['Criminal Law', 'Court Procedures', 'Evidence', 'Legal Research', 'Client Advocacy', 'Case Preparation'],
      family: ['Family Law', 'Mediation', 'Child Custody', 'Divorce Proceedings', 'Legal Documentation', 'Client Counseling'],
      international: ['International Law', 'Cross-border Transactions', 'Trade Law', 'Regulatory Compliance', 'Multilingual Documentation']
    },
    other: {
      default: ['Communication', 'Problem Solving', 'Teamwork', 'Time Management', 'Adaptability', 'Leadership']
    }
  };

  // Experience bullet suggestions based on profession
  const experienceTemplates = {
    developer: [
      "Built and maintained {technology} applications with focus on performance and scalability",
      "Implemented {feature} using {technology}, resulting in {outcome}",
      "Collaborated with cross-functional teams to deliver {deliverable} on time",
      "Optimized existing codebase, reducing {metric} by {percentage}",
      "Integrated third-party APIs including {apis}"
    ],
    teacher: [
      "Developed and implemented curriculum for {subject} aligned with {standards}",
      "Created engaging lesson plans that improved student engagement by {metric}",
      "Assessed student progress using {assessment_method}",
      "Collaborated with colleagues to improve {educational_aspect}",
      "Communicated with parents regarding student progress and {concerns}"
    ],
    accountant: [
      "Prepared financial statements in compliance with {standards}",
      "Conducted audits ensuring accuracy and regulatory compliance",
      "Managed {financial_process} using {software}",
      "Analyzed financial data to identify {opportunities}",
      "Streamlined accounting procedures, reducing {metric} by {percentage}"
    ],
    other: [
      "Successfully {action} resulting in {outcome}",
      "Managed {responsibility} with focus on {focus_area}",
      "Collaborated with team to achieve {goal}",
      "Improved {process} by implementing {solution}",
      "Demonstrated strong {skill} in {context}"
    ]
  };

  function suggestSkills(profession, specialization, currentSkills = []) {
    const prof = profession || 'other';
    const spec = specialization || '';
    
    let suggestions = [];
    
    // Get profession-specific suggestions
    if (skillMappings[prof]) {
      if (spec && skillMappings[prof][spec]) {
        suggestions = [...skillMappings[prof][spec]];
      } else if (skillMappings[prof].default) {
        suggestions = [...skillMappings[prof].default];
      } else {
        // Get all skills for the profession
        Object.values(skillMappings[prof]).forEach(skills => {
          if (Array.isArray(skills)) suggestions.push(...skills);
        });
      }
    } else {
      suggestions = [...skillMappings.other.default];
    }
    
    // Filter out skills the user already has
    const currentLower = currentSkills.map(s => s.toLowerCase());
    return suggestions.filter(s => !currentLower.includes(s.toLowerCase()));
  }

  function suggestExperienceBullets(profession, context = {}) {
    const prof = profession || 'other';
    const templates = experienceTemplates[prof] || experienceTemplates.other;
    
    // Replace placeholders with context
    return templates.map(template => {
      let result = template;
      Object.keys(context).forEach(key => {
        result = result.replace(`{${key}}`, context[key]);
      });
      return result;
    });
  }

  function getRelatedSkills(skill) {
    const skillLower = skill.toLowerCase();
    const related = [];
    
    // Search through all mappings for related skills
    Object.values(skillMappings).forEach(professionMap => {
      Object.values(professionMap).forEach(skills => {
        if (Array.isArray(skills)) {
          if (skills.some(s => s.toLowerCase().includes(skillLower))) {
            related.push(...skills.filter(s => s.toLowerCase() !== skillLower));
          }
        }
      });
    });
    
    // Remove duplicates and limit to 5
    return [...new Set(related)].slice(0, 5);
  }

  return {
    suggestSkills,
    suggestExperienceBullets,
    getRelatedSkills
  };
})();

if (typeof module !== 'undefined') module.exports = OfflineHelpers;
