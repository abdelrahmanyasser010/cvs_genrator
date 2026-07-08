# CV Studio Product Bible

Version: 2.0  
Status: Active  
Owner: Abdelrahman Yasser  
Last Updated: 2026-07-04

---

# Vision

CV Studio is an AI-assisted Resume Builder focused on producing professional, ATS-friendly, bilingual CVs through a simple conversational experience.

The product is designed for **every profession**—not only software developers.

The primary objective is to let any user build a professional CV in less than 10 minutes without needing resume writing experience.

---

# Mission

Building a professional CV should never require Microsoft Word skills.

The system guides the user, suggests improvements, writes professionally, and exports recruiter-ready PDFs.

**The AI is an assistant.**  
**The product is NOT an AI chat application.**

---

# Core Philosophy

**People First**  
**AI Second**  
**CV First**

Everything inside CV Studio exists only if it improves the user's CV.

---

# Product Principles

- **Simplicity over Complexity**
- **Conversation over Forms**
- **Guidance over Freedom**
- **One Question at a Time**
- **Live Preview Always**
- **Offline First**
- **AI Optional**
- **ATS Friendly by Default**

---

# Target Users

- Students
- Fresh Graduates
- Junior Professionals
- Mid-level Professionals
- Senior Professionals
- Freelancers
- Career Changers
- Business Owners

---

# Supported Professions

Current (v2.0):
- Developer
- Teacher
- Accountant

Planned:
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
- Other

**The architecture must support unlimited professions.**  
Profession data lives inside Knowledge Base.  
Never hardcode profession logic.

---

# MVP

The first public version contains ONLY:

✅ CV Builder  
✅ AI Assistant  
✅ Live Preview  
✅ PDF Export  
✅ Multiple Templates  
✅ Arabic  
✅ English  

Nothing else.

---

# Out of Scope

- Portfolio
- Cover Letter
- Interview Coach
- Job Tracker
- LinkedIn Optimizer
- GitHub Analyzer

These features belong to future products.

---

# User Journey

```
Landing
↓
Choose Language
↓
Choose Profession
↓
Conversational Wizard
↓
Preview Updates Live
↓
AI Improvements (Optional)
↓
Choose Template
↓
Export PDF
Done.
```

---

# Wizard Rules

The Wizard is **NOT** a form.  
It behaves like a conversation.

**Only one question is visible.**

Examples:
- "Hi 👋"
- "What's your name?"
- "Nice to meet you Ahmed ❤️"
- "What do you do?"
- "How many years of experience?"

**Never ask multiple questions simultaneously.**

---

# Editor Rules

- Live Preview is mandatory
- Every change updates the preview
- Autosave every few seconds
- Undo available
- Examples available
- AI buttons small and contextual

---

# AI Philosophy

AI never controls the product.  
The user controls the product.  
AI only assists.

---

# AI Must Never

- Invent experience
- Invent projects
- Invent companies
- Invent technologies
- Change dates
- Change years
- Claim certifications
- Increase seniority
- Fake achievements
- Hallucinate

---

# AI Can

- Improve wording
- Shorten text
- Translate
- Generate bullets
- Suggest skills
- Improve ATS wording
- Fix grammar

---

# Template Rules

Every template must:

- Support A4
- Support Print
- Support PDF
- Support RTL
- Support LTR
- Support Arabic
- Support English
- Be ATS Friendly
- Be Responsive

---

# Template Types

- Classic
- ATS
- Modern
- Minimal
- Executive
- Sidebar
- Timeline
- Academic
- Creative
- Corporate

Additional templates are plug-ins.

---

# Knowledge Base

Every profession contains:

- Summary Templates
- Skills
- Action Verbs
- Achievements
- Projects
- Keywords
- ATS Keywords
- Interview Keywords
- Questionnaire
- Examples

**Nothing is hardcoded.**

---

# Languages

- Arabic
- English

Arabic is first-class.  
Translation quality is human-level.  
Never translate technology names.

---

# CV Rules

**Experience < 5 years** → Prefer one page.  
**Experience > 7 years** → Maximum two pages.

Never create decorative resumes.  
Never prioritize appearance over readability.

---

# ATS Rules

- No progress bars
- No skill percentages
- No stars for skills
- No unnecessary icons
- Simple typography
- Readable spacing

---

# Export Rules

Export must produce:

- PDF
- HTML
- JSON

Future:
- DOCX

---

# Product Identity

**Official Name:** CV Studio

**Not:**
- Career Studio
- AI Career Studio

---

# Future Vision

**Version 2:** Knowledge Base Expansion  
**Version 3:** AI Optimization  
**Version 4:** Job Description Matching  
**Version 5:** Enterprise Version

---

# Related Documents

- [02_ARCHITECTURE.md](./02_ARCHITECTURE.md) - System architecture
- [03_UI_UX_GUIDELINES.md](./03_UI_UX_GUIDELINES.md) - Design decisions
- [04_AI_SYSTEM.md](./04_AI_SYSTEM.md) - AI behavior
- [05_KNOWLEDGE_BASE.md](./05_KNOWLEDGE_BASE.md) - Knowledge structure
- [06_ROADMAP.md](./06_ROADMAP.md) - Product roadmap
- [07_CONTRIBUTING.md](./07_CONTRIBUTING.md) - Contribution guidelines
- [docs/adr/](./adr/) - Architecture Decision Records
