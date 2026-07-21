# CV Studio — UX Fix Sprint 2

## Implemented

- Removed the separate welcome step from the wizard flow.
- Added a professional summary step with a larger textarea and factual guidance.
- Rebuilt wizard education input into degree + institution + year.
- Rebuilt wizard experience input into role + company/place + period + 2–4 bullet lines.
- Added role-based starter bullet suggestions only as editable suggestions, not hidden auto-filled facts.
- Rebuilt wizard skills step as text input + role-based selectable skill chips.
- Rebuilt template selection as visual thumbnail cards.
- Removed “AI Recommended” wording from the template flow and changed it to “Recommended”.
- Tightened section status logic: sections are not marked as good just because text exists.
- Simplified editor top bar: shorter save state, icon-only undo/redo, less visible version/backup clutter.
- Moved versioning and advanced section management into menus instead of main toolbar priority.
- Added “Add section” modal for optional sections.
- Fixed editor scroll/overflow issues with bottom padding so footer/actions do not cover content.
- Adjusted preview/canvas spacing so the CV is not clipped from the top in desktop view.
- Improved CV header contact line with SVG icons aligned on the same baseline.
- Improved AI wording for summary and experience review modals.
- Improved fallback summary and experience bullet generation to avoid short/silly output and avoid invented numbers.
- Kept privacy/backup available through menus/export without repeating noisy “this device only” messages in the main chrome.

## Verified

- JavaScript syntax check for app, engine, coach, tools, and tests.
- `npm run check` passed:
  - production check
  - senior delivery check
  - production security check

## Not run

- Playwright E2E smoke test could not run in this sandbox because local browser navigation to `localhost` was blocked by the environment (`ERR_BLOCKED_BY_ADMINISTRATOR`).

## Still recommended before public production

- Manual browser QA after deployment on Chrome, Edge, Safari, Android Chrome, and iOS Safari.
- Real PDF/DOCX export QA with Arabic and English samples.
- Full UI review on 320px, 390px, 768px, 1024px, and desktop.
