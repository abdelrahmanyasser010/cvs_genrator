# CV Studio Contributing Guide

Version: 2.0  
Last Updated: 2026-07-04

---

# Getting Started

## Prerequisites

- Node.js (optional, for future tooling)
- Python (for local server)
- Modern browser
- Git

## Setup

```bash
# Clone repository
git clone <repository-url>
cd cvs_genrator

# Start local server
python -m http.server 5500

# Open browser
http://localhost:5500/app/index.html
```

---

# Coding Standards

## JavaScript

- Use camelCase for variables and functions
- Use PascalCase for classes
- Use UPPER_CASE for constants
- Use kebab-case for files
- 2 space indentation
- Semicolons required
- No trailing whitespace
- Max line length: 100

## CSS

- Use kebab-case for classes
- Use BEM naming when appropriate
- 2 space indentation
- Group related styles
- Avoid inline styles
- Use CSS variables for theming

## JSON

- 2 space indentation
- Trailing commas allowed
- Double quotes required
- No comments in JSON

---

# Folder Structure

## Rules

- No hardcoded professions
- No hardcoded translations
- No inline CSS
- No inline JS
- Every feature must support Arabic and English

## Adding Features

1. Check if it belongs in existing module
2. Create new folder if needed
3. Follow naming conventions
4. Add to documentation
5. Test both languages

---

# Templates

## Requirements

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

## Testing

- Test print preview
- Test PDF export
- Test with Arabic content
- Test with English content
- Test on mobile
- Test on desktop

## Adding New Template

1. Create folder in `templates/`
2. Add `template.json`
3. Add `style.css`
4. Add HTML layout
5. Test all requirements
6. Add to registry

---

# Knowledge Base

## Adding Profession

1. Add to `knowledge-base/registry.json`
2. Create folder in `knowledge-base/en/`
3. Create folder in `knowledge-base/ar/`
4. Add `profile.json`
5. Add content (summary, skills, etc.)
6. Test auto-discovery

## Content Quality

- 20+ summary templates
- Professional tone
- Industry-specific
- Bilingual
- No duplicates

---

# Localization

## Adding Language

1. Create folder in `app/assets/i18n/`
2. Add `language.json`
3. Add font to index.html
4. Update i18n.js
5. Test all pages

## Translation Rules

- Human-level quality
- Professional tone
- Never translate technology names
- Never translate company names
- Keep technical terms in English when appropriate

---

# AI Layer

## Adding Provider

1. Create file in `engine/ai/providers/`
2. Implement `setKey()` and `generate()`
3. Add to AI Settings UI
4. Add to documentation
5. Test with and without API key

## Adding Prompt Module

1. Create file in `engine/ai/prompts/`
2. Implement `getPrompt()` and `previewPrompt()`
3. Add context support
4. Add bilingual templates
5. Test with all providers

---

# Testing

## Manual Testing

- Test wizard flow
- Test editor flow
- Test export (PDF, HTML, JSON)
- Test all templates
- Test both languages
- Test on mobile
- Test on desktop

## Print Testing

- Print preview
- PDF export
- Check page breaks
- Check formatting
- Check fonts

## RTL Testing

- Test with Arabic content
- Check layout direction
- Check text alignment
- Check padding/margins

---

# Pull Requests

## Process

1. Fork repository
2. Create branch
3. Make changes
4. Test thoroughly
5. Update documentation
6. Submit PR

## PR Checklist

- [ ]代码 follows standards
- [ ] No hardcoded professions
- [ ] No hardcoded translations
- [ ] Supports Arabic
- [ ] Supports English
- [ ] Templates print correctly
- [ ] Templates support RTL
- [ ] Templates support LTR
- [ ] Documentation updated
- [ ] Manual testing completed

---

# Commit Messages

## Format

```
type(scope): description

Examples:
feat(wizard): add conversational flow
fix(editor): resolve autosave issue
docs(readme): update setup instructions
style(css): improve button styling
refactor(ai): simplify prompt builder
test(knowledge): add profession tests
```

## Types

- feat: New feature
- fix: Bug fix
- docs: Documentation
- style: Formatting
- refactor: Refactoring
- test: Testing
- chore: Maintenance

---

# Issues

## Reporting

1. Check existing issues
2. Use template
3. Provide steps to reproduce
4. Include browser info
5. Include screenshots if applicable

## Labels

- bug
- enhancement
- documentation
- good first issue
- help wanted

---

# Code Review

## Guidelines

- Be constructive
- Explain reasoning
- Suggest improvements
- Ask questions
- Be respectful

## Review Checklist

- Code follows standards
- No security issues
- No performance issues
- Documentation updated
- Tests added (if applicable)

---

# Related Documents

- [01_PRODUCT_BIBLE.md](./01_PRODUCT_BIBLE.md) - Product philosophy
- [02_ARCHITECTURE.md](./02_ARCHITECTURE.md) - System architecture
- [03_UI_UX_GUIDELINES.md](./03_UI_UX_GUIDELINES.md) - Design guidelines
