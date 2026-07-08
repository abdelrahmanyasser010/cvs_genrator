# CV Studio AI System

Version: 2.0  
Last Updated: 2026-07-04

---

# Goal

Help users. Never replace them.

---

# Providers

## Supported

- **Gemini** (Google) - Free tier available
- **OpenRouter** - Multi-model access
- **OpenAI** - GPT models
- **Anthropic** - Claude models

## Offline

- Knowledge-based suggestions
- Rule-based improvements
- No API required

---

# Capabilities

## What AI Can Do

- Improve wording
- Shorten text
- Translate (AR ↔ EN)
- Generate bullets
- Suggest skills
- Improve ATS wording
- Fix grammar

## What AI Cannot Do

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

# Safety Rules

## Never Invent

- Experience
- Projects
- Companies
- Years
- Certifications
- Awards
- Skills not mentioned

## Always Validate

- Reject hallucinations
- Reject empty responses
- Keep formatting
- Verify against user input

---

# Prompt Rules

## Required Context

Every prompt must receive:

- Profession
- Language
- Experience Level
- Current Section
- Current Content
- Target Length

## Prompt Structure

```
Role
↓
Task
↓
Context
↓
Constraints
↓
Output Format
```

## Example

```
You are a professional CV writer.
Rewrite this experience bullet for a Developer with 3 years experience.
Make it action-oriented, quantifiable, and impactful.
Keep it under 25 words.

Original: "Worked on React app"
```

---

# Prompt Modules

## Summary
- `engine/ai/prompts/summary.js`
- Generates contextual prompts for professional summary
- Based on profession, language, experience level

## Experience
- `engine/ai/prompts/experience.js`
- Rewrite, improve, shorten experience bullets
- Context-aware based on profession

## Skills
- `engine/ai/prompts/skills.js`
- Suggest relevant skills
- From project descriptions or profession

## Projects
- `engine/ai/prompts/projects.js`
- Generate project descriptions
- Convert to bullets

## Translate
- `engine/ai/prompts/translate.js`
- Translate between AR and EN
- Maintain professional tone

## Tailor
- `engine/ai/prompts/tailor.js`
- Match CV to job description
- Highlight relevant skills

---

# Offline Helpers

## Location
- `engine/ai/offline-helpers.js`

## Features

### Skill Suggestions
- Knowledge-based mappings
- Flutter → Bloc, Dio, Hive, Firebase
- Accountant → Excel, ERP, QuickBooks, VAT

### Experience Templates
- Profession-specific bullet templates
- Fill-in-the-blank patterns

### Related Skills
- Discover related skills from knowledge base

## Advantages

- No API required
- Instant results
- No cost
- Works offline

---

# Cost Control

## Tracking

- Track token usage per provider
- Calculate cost per operation
- Display total cost to user
- Reset option available

## Storage

- Costs stored in localStorage
- Key: `cv_studio_ai_cost`
- Format: Decimal number

## Limits

- Warn before expensive operations
- Allow user to set monthly budget
- Block when limit reached

---

# Prompt Preview

## Purpose

Allow users to see what will be sent to AI before sending.

## Implementation

- Toggle in AI Settings
- Show prompt in modal
- Allow editing before sending
- Debug mode for developers

---

# Fallback Strategy

## When AI Fails

1. Try offline helpers
2. Show error message
3. Suggest manual editing
4. Never block user

## When No API Key

- Use offline helpers only
- Show helpful message
- Guide to AI Settings

---

# Response Validation

## Checks

- Not empty
- Not hallucinated
- Matches constraints
- Proper formatting

## On Failure

- Retry once
- Show error
- Fallback to offline

---

# Future: Local Models

## Planned

- WebLLM integration
- Local LLaMA models
- Browser-based inference

## Benefits

- Zero cost
- Privacy
- Offline
- No API keys

---

# Related Documents

- [01_PRODUCT_BIBLE.md](./01_PRODUCT_BIBLE.md) - AI philosophy
- [02_ARCHITECTURE.md](./02_ARCHITECTURE.md) - AI layer structure
- [docs/adr/](./adr/) - AI-related ADRs
