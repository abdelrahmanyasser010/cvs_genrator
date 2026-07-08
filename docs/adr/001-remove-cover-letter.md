# ADR-001: Remove Cover Letter Feature

## Status
Accepted

## Date
2026-07-04

## Context

The project initially included Cover Letter functionality alongside CV building. However, this caused the product to lose focus and increased complexity significantly.

## Decision

Remove Cover Letter feature entirely. Focus exclusively on CV building.

## Rationale

- **Focus**: CV Studio should be the best CV builder, not a generic document tool
- **Complexity**: Cover Letter requires different workflows, templates, and AI prompts
- **Market**: CV building is a larger market with clearer use cases
- **MVP**: Cover Letter is not essential for initial release
- **Future**: Cover Letter can be a separate product if needed

## Consequences

### Positive
- Clearer product focus
- Reduced complexity
- Faster development
- Better UX for CV building

### Negative
- Users requesting cover letters
- Potential revenue loss
- Need separate product for cover letters

## Alternatives Considered

1. Keep Cover Letter as separate module
2. Defer Cover Letter to future version
3. Create separate product for Cover Letter

**Chosen**: Remove entirely, consider separate product in future

## References

- [01_PRODUCT_BIBLE.md](../01_PRODUCT_BIBLE.md) - Out of Scope section
