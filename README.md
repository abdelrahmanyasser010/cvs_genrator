# CV Studio

Version 2.0 — AI-assisted Resume Builder

**Build professional, ATS-friendly CVs in 10 minutes.**

---

## What is CV Studio?

CV Studio is an AI-assisted Resume Builder focused on producing professional, ATS-friendly, bilingual CVs through a simple conversational experience.

**Key Features:**
- 🗣️ Conversational Wizard (one question at a time)
- 🤖 AI Assistant (optional, works offline too)
- 👁️ Live Preview (instant updates)
- 📄 PDF Export (print-ready)
- 🎨 11 Professional Templates
- 🌍 Bilingual (Arabic & English)
- 📚 Knowledge Base (profession-aware)
- ✅ ATS Scoring

**Philosophy:** People First, AI Second, CV First.

---

## Quick Start


> Important: Do not open `app/editor.html` or `app/index.html` directly with `file://`.
> The app must run through a local/static server because it loads shared JS, CSS, and JSON files.
> On Windows, double-click `start-cv-studio.bat` to start the local server and open the app.


```bash
# Start local server
node local-server.js

# Open browser
http://localhost:5500/app/onboarding.html
```

### Owner-managed AI setup

CV Studio uses one owner-managed Gemini key. End users do not enter API keys.

Local setup:

```bash
copy .env.example .env
# Edit .env and set GEMINI_API_KEY
node local-server.js
```

Production setup:

- Set `GEMINI_API_KEY` in your hosting environment variables.
- Optional: set `GEMINI_MODEL` or `GEMINI_FALLBACK_MODELS` if you want to override the default model chain.
- Do not commit `.env` or any real API key to the repository.

1. Choose language (English / العربية)
2. Choose profession
3. Follow conversational wizard
4. Edit in editor with AI assistance (optional)
5. Choose template
6. Export PDF

---

## Demo

Load demo profile in wizard or import `data/samples/abdelrahman.json` in editor.

---

## Project Structure

```
cvs_genrator/
├── app/                    # Frontend application
│   ├── assets/            # JavaScript, CSS, i18n
│   ├── editor.html        # Editor page
│   ├── index.html         # Wizard page
│   └── onboarding.html    # Welcome page
├── engine/                # Core business logic
│   ├── ai/               # AI Layer
│   ├── renderers/        # CV rendering
│   └── *.js              # Core modules
├── coach/                 # Content improvement
├── templates/             # CV templates
│   ├── layouts/          # Layout definitions
│   ├── themes/           # Theme definitions
│   └── shared/           # Shared CSS
├── knowledge-base/        # Profession data
│   ├── en/               # English content
│   └── ar/               # Arabic content
├── docs/                  # Documentation
│   ├── 01_PRODUCT_BIBLE.md
│   ├── 02_ARCHITECTURE.md
│   ├── 03_UI_UX_GUIDELINES.md
│   ├── 04_AI_SYSTEM.md
│   ├── 05_KNOWLEDGE_BASE.md
│   ├── 06_ROADMAP.md
│   ├── 07_CONTRIBUTING.md
│   └── adr/              # Architecture Decision Records
└── data/                  # Samples and registry
```

---

## Tech Stack

- **Frontend:** Vanilla JavaScript (no frameworks)
- **Styling:** CSS3 with CSS Variables
- **Storage:** LocalStorage
- **AI:** Owner-managed Gemini API route, with optional local fallback providers for testing
- **Export:** HTML to PDF via browser print

---

## Documentation

- [01_PRODUCT_BIBLE.md](docs/01_PRODUCT_BIBLE.md) — Product vision and philosophy
- [02_ARCHITECTURE.md](docs/02_ARCHITECTURE.md) — System architecture
- [03_UI_UX_GUIDELINES.md](docs/03_UI_UX_GUIDELINES.md) — Design decisions
- [04_AI_SYSTEM.md](docs/04_AI_SYSTEM.md) — AI behavior and safety
- [05_KNOWLEDGE_BASE.md](docs/05_KNOWLEDGE_BASE.md) — Knowledge base structure
- [06_ROADMAP.md](docs/06_ROADMAP.md) — Product roadmap
- [07_CONTRIBUTING.md](docs/07_CONTRIBUTING.md) — Contribution guidelines
- [docs/adr/](docs/adr/) — Architecture Decision Records

---

## Supported Professions

Current (v2.0):
- Software Developer
- Teacher
- Accountant

Planned:
- Doctor, Dentist, Pharmacist, Lawyer, Architect, Engineer, HR, Marketing, Designer, and more.

---

## AI Features (Optional)


### AI Coach Experience

The editor and wizard include an offline-first AI Coach:

- Step-by-step wizard guidance while the user answers questions.
- Contextual section advice inside the editor.
- Pre-export review with blockers, warnings, and quick fixes.
- Owner-managed Gemini writing through the internal `/api/ai/generate` route.
- Optional local fallback providers remain available for testing only.
- Offline fallback remains available when no key is configured or a provider request fails.


CV Studio works fully without AI. When configured, AI can:

- ✨ Improve wording
- ✂️ Shorten text
- 🌐 Translate (AR ↔ EN)
- • Generate bullets
- 💡 Suggest skills
- 🎯 Improve ATS wording

**Setup:** Configure `GEMINI_API_KEY` on the server or hosting provider. Users do not need API keys.

---

## MVP Scope

**Included:**
- ✅ CV Builder
- ✅ AI Assistant
- ✅ Live Preview
- ✅ PDF Export
- ✅ Multiple Templates
- ✅ Arabic & English

**Out of Scope:**
- ❌ Portfolio
- ❌ Cover Letter
- ❌ Interview Coach
- ❌ Job Tracker

---

## Roadmap

- **v1.0** — Feature Complete MVP (Current)
- **v1.1** — User feedback improvements
- **v1.2** — 20 professions, 20 templates
- **v2.0** — Multiple CVs, Cloud Sync
- **v3.0** — Job Matching, Interview Prep

See [06_ROADMAP.md](docs/06_ROADMAP.md) for details.


---

## Production Readiness

Run the local production check before deploying:

```bash
node tools/production-check.js
```

The app is a static site. Deploy the repository root to any static host such as Vercel, Netlify, Cloudflare Pages, or GitHub Pages. Production security headers are included in `vercel.json` and `_headers`.

Recommended smoke test after deployment:

1. Open `/app/onboarding.html` and create a resume.
2. Confirm the wizard preview renders while typing.
3. Open the editor, edit each core section, switch templates, and export PDF/HTML/JSON.
4. Import the exported JSON and confirm the resume reloads correctly.

---

## Contributing

See [07_CONTRIBUTING.md](docs/07_CONTRIBUTING.md) for guidelines.

---

## License

Proprietary — All rights reserved.

---

## Contact

Owner: Abdelrahman Yasser
