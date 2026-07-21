# CV Studio

Production-hardened local-first resume builder release candidate.

CV Studio helps users build bilingual, profession-aware resumes with live preview, transparent ATS-readiness guidance, and optional AI-assisted wording.

## Product principles

- Facts first: never invent employers, degrees, dates, skills, certifications, or metrics.
- User control: AI changes are previewed before being applied.
- Transparent ATS guidance: scores are indicators, not hiring guarantees.
- Local-first privacy: resumes remain in the current browser unless the user exports a backup.
- AI data minimization: contact details and links are excluded from AI requests.

## Run locally

```bash
cp .env.example .env
# Add the server-only GEMINI_API_KEY when AI is needed.
node local-server.js
```

Open:

```text
http://localhost:5500/app/onboarding.html
```

Do not open application pages through `file://`; the app loads shared assets and JSON rules through HTTP.

## AI architecture

The production browser does not accept or store API keys and does not call model providers directly.

Browser requests use the allowlisted task endpoint:

```text
POST /api/ai/generate
```

Supported tasks:

- `summary`
- `improve_text`
- `improve_bullets`
- `suggest_skills`
- `translate`

The server constructs prompts, validates/minimizes input, enforces output limits and timeouts, and logs token usage. A basic per-IP/session limiter is included; scaled production requires a durable shared rate-limit store.

## Data storage

Resume data is local-first and stored in the browser. The editor provides:

- Per-version storage.
- Recovery snapshot.
- One-file backup containing all resume versions.
- Backup import.
- Clear local-only status and failure messages.

A paid multi-device service still needs authentication, cloud storage, encryption, backups, and account deletion.

## Export

- PDF uses the browser print engine after waiting for fonts/images.
- DOCX uses the real `html-docx-js` converter when loaded.
- The app does not create a fake `.doc` file when DOCX conversion is unavailable.
- JSON backup is the recovery/export format for application data.

## Checks

```bash
npm run check
```

This runs syntax/assets, role-aware coach/storage, and AI security checks.

Responsive E2E smoke test:

```bash
pip install -r tests/requirements.txt
playwright install chromium
npm run test:e2e
```

Viewport coverage: 320, 390, 768, 1024, and 1366 px.

## Deployment

The project requires a host that supports the `/api` server functions, such as Vercel. It is no longer a static-only GitHub Pages deployment when AI and telemetry endpoints are enabled.

Configure server environment variables from `.env.example`. Never expose `GEMINI_API_KEY` in frontend code.

## Readiness

See:

- `PRODUCTION_READINESS.md`
- `CHANGELOG_PRODUCTION_RC.md`
- `SENIOR_DELIVERY_NOTES.md`
- `USER_TESTING_PLAN.md`

This build is suitable for a local-first beta. Complete the external authentication, cloud persistence, distributed rate limiting, legal, and operations requirements before calling it a paid account-based SaaS.
