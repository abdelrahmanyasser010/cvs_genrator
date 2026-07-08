# ADR-004: Knowledge Base Driven Architecture

## Status
Accepted

## Date
2026-07-04

## Context

Profession-specific logic (skills, examples, questions) was being hardcoded in application code, making it difficult to add new professions or update existing ones.

## Decision

Move all profession-specific data to Knowledge Base. Application code should be profession-agnostic and auto-discover professions from registry.

## Rationale

- **Extensibility**: Add new professions without code changes
- **Maintainability**: Update content without touching code
- **Localization**: Separate content from logic
- **Scalability**: Support unlimited professions
- **Collaboration**: Non-developers can contribute content

## Implementation

- `knowledge-base/registry.json` for profession discovery
- Separate folders per profession
- JSON files for structured data
- Auto-loading of profession data
- No hardcoded profession logic in code

## Consequences

### Positive
- Easy to add new professions
- Content updates without deployment
- Clear separation of concerns
- Better for collaboration

### Negative
- Initial setup complexity
- Need to validate data structure
- More files to manage

## Alternatives Considered

1. Hardcode everything in JavaScript
2. Use database instead of JSON files
3. Mix of hardcoded and external data

**Chosen**: Pure Knowledge Base driven with JSON files

## References

- [01_PRODUCT_BIBLE.md](../01_PRODUCT_BIBLE.md) - Knowledge Base section
- [05_KNOWLEDGE_BASE.md](../05_KNOWLEDGE_BASE.md) - Structure details
