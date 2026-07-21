# CV Studio — Production Readiness

This build is a **production-hardened release candidate for a local-first public beta**. It is not yet a full account-based paid SaaS.

## Implemented in this release

- Task-based same-origin AI API. The browser cannot submit arbitrary prompts.
- Server-side prompt construction, input limits, output limits, timeouts, model fallback, and basic safety settings.
- Per-IP/session in-memory rate limiting and usage-token logging.
- Browser API-key storage and direct provider requests removed.
- Explicit AI consent with a preview of the minimized payload.
- AI payload excludes name, email, phone, address, and links.
- Local recovery snapshot, multi-version backup bundle, backup reminder, and import support.
- No fake `.doc` export fallback; DOCX fails transparently when its real converter is unavailable.
- Print waits for fonts and images before opening the browser print dialog.
- ATS wording changed from guarantees to transparent readiness guidance.
- Fake/unsupported testimonial claims removed.
- Privacy-minimized client error telemetry.
- Automated syntax, business-rule, storage, AI-security, and responsive E2E smoke checks.

## Required before a paid account-based launch

1. **Authentication and cloud persistence**
   - Choose an identity provider and database.
   - Encrypt data at rest, add backups, recovery, version history, and account deletion.
   - Migrate local resumes only after explicit user confirmation.

2. **Distributed rate limiting**
   - The included limiter protects one running instance.
   - For horizontally scaled/serverless production, connect the same guard to a durable shared store.

3. **Legal policy**
   - Replace `app/privacy.html` with counsel-reviewed Privacy Policy and Terms.
   - Document the AI provider, retention terms, subprocessors, legal entity, and supported regions.

4. **Export certification**
   - Test PDF/DOCX on supported Chrome, Edge, Safari, iOS, Android, Microsoft Word, and Google Docs.
   - Keep an export fixture suite for one-, two-, and three-page Arabic and English resumes.

5. **Professional content review**
   - Have each profession’s rules reviewed by qualified practitioners in the target market.
   - Store reviewer, market, source, and review date metadata.

6. **Observability and operations**
   - Connect error logs and AI usage logs to a real monitoring provider.
   - Add alerting, incident response, budget limits, and uptime monitoring.

## Release recommendation

- Demo/internal testing: ready.
- Closed beta: ready after deployment smoke test.
- Local-first public beta: suitable with a clear Beta label.
- Paid SaaS with accounts/cloud sync: complete the external requirements above first.
