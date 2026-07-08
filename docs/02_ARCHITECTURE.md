# CV Studio Architecture

Version: 2.0  
Last Updated: 2026-07-04

---

# Overview

CV Studio is a modular frontend application.

Every feature must be replaceable without affecting the rest of the system.

No module should know implementation details of another module.

The architecture follows:

```
UI
↓
Controllers
↓
Business Engine
↓
Storage
↓
Render Engine
↓
Export Engine
```

---

# Current Structure

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
└── data/                 # Samples and registry
```

---

# Planned Structure (Future Refactor)

```
src/
├── core/                  # Shared utilities
├── wizard/                # Wizard logic
├── editor/                # Editor logic
├── preview/               # Preview engine
├── templates/             # Template system
├── knowledge/             # Knowledge base
├── ai/                    # AI layer
├── storage/               # Storage layer
├── export/                # Export engine
├── shared/                # Shared code
└── i18n/                  # Localization
```

---

# Modules

## Wizard

**Responsibilities:**
- Collect user information
- Guide the user
- Validate input

**Never:**
- Render CV
- Export
- Know template logic

---

## Editor

**Responsibilities:**
- Edit data
- Autosave
- Call AI
- Refresh Preview

**Nothing else.**

---

## Preview Engine

**Receives:**
- Career Object
- Template
- Language

**Outputs:** HTML

**Never:** Edits data

---

## Template Engine

- Loads template metadata
- Loads CSS
- Loads HTML Layout
- Receives normalized data
- Returns printable CV

---

## Storage Layer

**Supports:**
- LocalStorage
- Import JSON
- Export JSON

**Future:**
- Cloud Sync
- Google Drive
- Dropbox

---

## Export Engine

**Current:**
- PDF
- HTML
- JSON

**Future:**
- DOCX
- PNG

---

## Knowledge Base

**Contains:**
- Profession Data
- Examples
- Skills
- Action Verbs
- Questionnaires
- AI Context
- ATS Keywords

**No UI inside Knowledge Base.**

---

## AI Layer

**Providers:**
- Gemini
- OpenRouter
- OpenAI
- Anthropic

**Features:**
- Offline Helpers
- Prompt Builder
- Response Validator
- Cost Tracker

---

## Localization

Languages are plug-ins.

**Current:**
- Arabic
- English

**Future:**
- French
- German
- Spanish

---

# Dependency Rules

**Wizard** cannot import:
- Preview
- Editor

**Editor** cannot import:
- AI Provider directly

**Everything goes through AI Layer.**

**Knowledge Base** must never import UI.

**Templates** must never import business logic.

---

# Naming Rules

- **camelCase** - Variables
- **PascalCase** - Classes
- **kebab-case** - Files
- **UPPER_CASE** - Constants

---

# Data Flow

```
User Input
↓
Wizard
↓
Career Object
↓
Storage
↓
Editor
↓
AI Layer (Optional)
↓
Preview Engine
↓
Template Engine
↓
Export Engine
↓
PDF/HTML/JSON
```

---

# Key Files

| File | Purpose |
|------|---------|
| `engine/career-storage.js` | Storage operations |
| `engine/normalize-career.js` | Data normalization |
| `engine/template-selector.js` | Template selection |
| `engine/layout-engine.js` | Layout rendering |
| `engine/ai/index.js` | AI layer entry |
| `engine/ai/offline-helpers.js` | Knowledge-based suggestions |
| `app/assets/wizard.js` | Wizard logic |
| `app/assets/editor.js` | Editor logic |

---

# Related Documents

- [01_PRODUCT_BIBLE.md](./01_PRODUCT_BIBLE.md) - Product vision
- [03_UI_UX_GUIDELINES.md](./03_UI_UX_GUIDELINES.md) - Design guidelines
- [04_AI_SYSTEM.md](./04_AI_SYSTEM.md) - AI architecture
- [docs/adr/](./adr/) - Architecture Decision Records
