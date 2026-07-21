# CV Studio — Senior Delivery Notes

## What was corrected

- Rebuilt the onboarding flow so personal details are entered once in a unified **Basic Profile** step.
- Restored and tested the missing profession and experience-level screens.
- Fresh graduates now see the experience step and may explicitly skip it; internships, practicum, clinical rotations, freelance work, and volunteering are treated as real evidence.
- Senior quick start no longer assumes the user is a developer; it asks for profession and exact target title.
- Added role-aware project visibility so accountants, teachers, healthcare roles, and similar professions are not incorrectly blocked by a projects requirement.
- Added profession/level/specialization editing inside the editor.
- Consolidated coach logic around **Overview / Mentor / ATS** and removed the old conflicting coach script from the editor page.
- Added role- and seniority-aware coaching profiles for all registered professions, with distinct guidance for accounting, healthcare, education, HR, sales, law, design, analytics, project management, engineering, and other roles.
- Separated **ATS Readiness** from **Job Description Match**.
- Fixed the Job Description comparison so the pasted job description is never searched inside itself.
- Skills and keywords are never added silently; the user must confirm genuine experience.
- AI experience improvements use a preview/accept workflow and do not invent tools, metrics, employers, schools, credentials, or achievements.
- Removed fabricated starter-CV content and blocked export when known demo placeholders are detected.
- Rebuilt multi-CV storage so the master CV is preserved while duplicating, switching, and deleting tailored versions.
- Added Certificates and Awards support across normalization, forms, rendering, ordering, and translations.
- Reworked mobile/tablet editor modes: content, preview, and improvement are deliberate full-screen modes; the Career Coach and ATS are accessible on mobile.
- Simplified the mobile top bar, score card, bottom navigation, section rows, edit panel, and responsive CSS overrides.
- Added missing profession rules for `designer` and `other`.

## Verification performed

- JavaScript syntax check across `app`, `coach`, and `engine`.
- Production asset/reference check.
- Role-aware coach, ATS separation, profession rules, and multi-version storage tests.
- Wizard smoke tests at 320×720, 390×844, 768×1024, and 1366×900.
- Editor smoke tests at 320×720, 390×844, 768×1024, and 1366×900.
- Verified mobile transitions between content, preview, and coach without runtime errors.
- Verified a job description containing missing requirements does not produce a false 100% match.

## Intentionally not claimed

- Job-match percentages are keyword-based guidance, not a hiring guarantee or a simulation of every ATS vendor.
- PDF/DOCX resume parsing and LinkedIn importing were not added. Reliable parsing requires a dedicated parser/backend and must not be implemented as a misleading client-side placeholder.
- AI suggestions still require user confirmation; the application does not verify that a user truly owns a skill, license, metric, or achievement.
