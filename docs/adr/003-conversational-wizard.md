# ADR-003: Conversational Wizard Instead of Forms

## Status
Accepted

## Date
2026-07-04

## Context

Traditional CV builders use multi-field forms that overwhelm users. Users often don't know what to write in each field, leading to abandonment.

## Decision

Implement a conversational wizard that asks one question at a time, like talking to a career coach.

## Rationale

- **Simplicity**: One question reduces cognitive load
- **Guidance**: Conversational tone feels more personal
- **Completion**: Step-by-step approach increases completion rate
- **Quality**: Focused questions lead to better answers
- **Accessibility**: Less intimidating for non-technical users

## Implementation

- Single question per screen
- Friendly, conversational tone
- Progress indication
- Back navigation
- Skip options when appropriate
- Auto-focus on input
- Enter key to continue

## Consequences

### Positive
- Higher completion rate
- Better user experience
- More focused answers
- Reduced abandonment

### Negative
- More clicks to complete
- Longer time for power users
- Requires careful copywriting

## Alternatives Considered

1. Traditional multi-field form
2. Hybrid (form with conversational elements)
3. AI-powered chat interface

**Chosen**: Pure conversational wizard with one question per step

## References

- [01_PRODUCT_BIBLE.md](../01_PRODUCT_BIBLE.md) - Wizard Rules
- [03_UI_UX_GUIDELINES.md](../03_UI_UX_GUIDELINES.md) - Wizard section
