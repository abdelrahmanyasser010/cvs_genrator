# CV Studio Knowledge Base

Version: 2.0  
Last Updated: 2026-07-04

---

# Purpose

The Knowledge Base contains all profession-specific data.  
Nothing is hardcoded in the application code.

---

# Structure

```
knowledge-base/
├── registry.json              # All professions
├── en/                        # English content
│   ├── developer/
│   │   ├── profile.json
│   │   ├── summary/
│   │   ├── skills/
│   │   ├── projects/
│   │   └── achievements/
│   ├── teacher/
│   ├── accountant/
│   └── ...
└── ar/                        # Arabic content
    ├── developer/
    ├── teacher/
    ├── accountant/
    └── ...
```

---

# Registry

## File
- `knowledge-base/registry.json`

## Purpose
- List all supported professions
- Provide metadata for UI
- Enable auto-discovery

## Structure

```json
{
  "professions": [
    {
      "id": "developer",
      "names": {
        "en": "Software Developer",
        "ar": "مطور برمجيات"
      },
      "icon": "💻",
      "specializations": ["flutter", "android", "web", "backend"]
    }
  ]
}
```

---

# Profile Structure

Every profession has a `profile.json`:

```json
{
  "id": "developer",
  "defaultTitle": "Software Developer",
  "recommendedTemplates": ["modern", "sidebar"],
  "experienceLevels": ["fresh", "junior", "mid", "senior"],
  "specializations": ["flutter", "android", "web", "backend"]
}
```

---

# Content Per Profession

## Summary Templates

- 20+ summary examples
- By experience level
- By language
- Professional tone

## Skills

- Technical skills
- Soft skills
- Tools
- Frameworks
- Grouped by specialization

## Action Verbs

- Strong verbs for experience
- By profession
- By level
- Bilingual

## Achievements

- Common achievements
- Quantifiable examples
- Industry-specific

## Projects

- Project ideas
- Descriptions
- Technologies used
- Outcomes

## ATS Keywords

- Keywords for ATS
- Industry terms
- Skills keywords
- Tool keywords

## Interview Keywords

- Common interview topics
- Technical questions
- Behavioral questions

## Questionnaire

- Profession-specific questions
- For smart questionnaire feature
- Bilingual

## Examples

- Complete CV examples
- By experience level
- By language
- Real-world samples

---

# Current Professions

## Developer
- Specializations: Flutter, Android, Web, Backend
- Status: ✅ Complete

## Teacher
- Specializations: Primary, Secondary, University
- Status: ✅ Complete

## Accountant
- Specializations: Tax, Audit, Financial
- Status: ✅ Complete

---

# Planned Professions

- Doctor
- Dentist
- Pharmacist
- Lawyer
- Architect
- Civil Engineer
- Mechanical Engineer
- HR
- Marketing
- Graphic Designer
- UI/UX Designer
- Customer Service
- Sales
- Speech Therapist
- Nurse
- Project Manager

---

# Adding a New Profession

## Steps

1. Add to `registry.json`
2. Create folder in `knowledge-base/en/`
3. Create folder in `knowledge-base/ar/`
4. Add `profile.json`
5. Add summary templates
6. Add skills
7. Add action verbs
8. Add achievements
9. Add projects
10. Add keywords
11. Add questionnaire
12. Add examples

## No Code Changes Required

The application auto-discovers professions from registry.

---

# Localization

## English

- Professional tone
- Industry-standard terminology
- Clear and concise

## Arabic

- Human-level translation
- Professional tone
- Cairo font recommended
- RTL layout

## Rules

- Never translate technology names
- Never translate company names
- Keep technical terms in English when appropriate

---

# Quality Standards

## Summary Templates

- 2-3 sentences
- Professional tone
- Action-oriented
- Quantifiable when possible

## Skills

- Current and relevant
- Industry-standard
- No duplicates
- Grouped logically

## Action Verbs

- Strong and specific
- Past tense for experience
- Present tense for current roles

## Keywords

- ATS-friendly
- Industry-relevant
- High search volume

---

# Maintenance

## Updates

- Review quarterly
- Add new technologies
- Remove outdated skills
- Update examples

## Community Contributions

- PRs welcome
- Must follow structure
- Must be bilingual
- Must pass review

---

# Related Documents

- [01_PRODUCT_BIBLE.md](./01_PRODUCT_BIBLE.md) - Product philosophy
- [02_ARCHITECTURE.md](./02_ARCHITECTURE.md) - Knowledge base integration
- [KNOWLEDGE_BASE_ARCHITECTURE.md](../KNOWLEDGE_BASE_ARCHITECTURE.md) - Technical details
