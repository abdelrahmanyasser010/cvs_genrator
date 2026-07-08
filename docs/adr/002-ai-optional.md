# ADR-002: AI is Optional, Not Required

## Status
Accepted

## Date
2026-07-04

## Context

Many AI-powered products require users to have API keys or pay for AI services. This creates friction and limits accessibility.

## Decision

AI features are optional. The product must work fully without any AI provider. Offline helpers and knowledge-based suggestions provide value without requiring API keys.

## Rationale

- **Accessibility**: Not all users have API keys or can afford AI services
- **Reliability**: Product should work even when AI services are down
- **Privacy**: Some users prefer not to send data to AI providers
- **Cost**: Free tier users shouldn't be blocked from core features
- **Performance**: Offline helpers are instant, no network latency

## Implementation

- Knowledge-based skill suggestions
- Rule-based content improvements
- Template-based examples
- Fallback to offline when AI fails
- Clear UI indication of AI vs offline features

## Consequences

### Positive
- Product works without API keys
- Instant responses from offline helpers
- No dependency on external services
- Lower barrier to entry

### Negative
- AI features may be underutilized
- Need to maintain two systems (AI + offline)
- Offline suggestions may be less personalized

## Alternatives Considered

1. Require AI key for all features
2. Freemium model with AI behind paywall
3. Use only free AI providers

**Chosen**: AI optional with robust offline alternatives

## References

- [01_PRODUCT_BIBLE.md](../01_PRODUCT_BIBLE.md) - AI Philosophy
- [04_AI_SYSTEM.md](../04_AI_SYSTEM.md) - Offline Helpers
