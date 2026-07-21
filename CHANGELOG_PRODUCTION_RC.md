# Production RC changelog

## Trust and AI security
- Replaced free-form browser prompts with an allowlisted task API.
- Moved prompt construction and guardrails to the server.
- Removed browser BYOK fields and direct OpenAI/Anthropic/OpenRouter/Gemini requests.
- Added request-size, output-token, timeout, origin, client-session, and rate-limit controls.
- Added explicit consent and privacy-minimized payload preview.

## Data safety
- Added rolling recovery snapshot.
- Added one-file backup for all resume versions.
- Added local-only storage warning and backup status.
- Added transparent storage failure UI.

## Export and ATS
- Wait for print assets before PDF printing.
- Removed fake Word fallback.
- Added export trust notice.
- Reworded ATS claims as guidance rather than guarantees.

## UX and quality
- Added collapsible desktop coach to reduce three-column overload.
- Kept three deliberate mobile modes: content, preview, improvement.
- Added privacy/settings and backup actions on desktop and mobile.
- Replaced unsupported testimonial claims with trust principles.
- Added privacy-minimized error telemetry.
- Added responsive E2E smoke tests for 320, 390, 768, 1024, and 1366 px.
