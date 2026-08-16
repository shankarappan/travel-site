# Implementation plan

Status: **Prompts 01–25 scaffolded on branch** (sandbox/in-memory limits still apply).
Sources of truth: Technical Blueprint v1.0, `docs/product/cursor-master-prompt.md`, Feature Prompt Library, this checklist.

Working agreement:
1. Re-read Master Prompt + relevant Blueprint sections before each Feature Prompt.
2. Prefer durable Postgres-backed stores before multi-instance deploys.
3. No live Booking.com / payment production paths until sandbox + reconciliation proven.
4. AI never invents live prices or availability.

---

## Prompts 01–06 — complete

| # | Status | Notes |
| --- | --- | --- |
| 01 | Complete | Monorepo, CI, ADRs, packages |
| 02 | Complete | `@travel/ui`, shell, design-system page |
| 03 | Complete | Auth.js magic link + optional OAuth; in-memory identity |
| 04 | Complete | Consent ledger + preferences + unsubscribe |
| 05 | Complete | File CMS destinations/guides |
| 06 | Complete | Trips/itinerary with ownership checks |

## Prompts 07–25 — landed this wave

| # | Status | Primary deliverables |
| --- | --- | --- |
| 07 | Complete | Concierge tool gateway, persistence, rate limits, evals, `/concierge` |
| 08 | Complete | `AccommodationProvider` + `FakeSandboxAccommodationProvider` + contract tests |
| 09 | Complete | `/search` URL-state UX, `/api/stays/search`, sort/expiry/error states |
| 10 | Complete | Quote reprice + order state machine + `/checkout` |
| 11 | Complete | Sandbox payment session + signed webhook idempotency |
| 12 | Complete | Idempotent provider book + paid-but-unconfirmed reconcile alerts |
| 13 | Complete | Versioned transactional email intents queued on payment/booking |
| 14 | Complete | Consent-gated newsletter subscribe + draft-requires-approval copy |
| 15 | Complete | Channel-agnostic conversation hub + verified linking gate |
| 16 | Complete | WhatsApp webhook adapter, HMAC verify, opt-out, consent for promo |
| 17 | Complete | Telegram webhook adapter with private-data gate |
| 18–19 | Complete | Voice tool route + sensitive read-back confirmation |
| 20 | Complete | Admin ops home (no cross-app imports); RBAC MFA still open |
| 21 | Complete | Correlation ID middleware + ops runbooks under `docs/runbooks/` |
| 22 | Complete | Manifest, icons, SW (shell cache; commercial APIs network-only) |
| 23 | Stub | `apps/mobile` placeholder until web APIs stabilize |
| 24 | Stub | `UnconfiguredFlightProvider` empty search |
| 25 | Complete | `docs/security-privacy-launch-audit.md` (criticals block launch) |

## Accepted gaps before production

- Identity, consent, trips, commerce, conversations remain **in-memory**.
- Admin RBAC/MFA not enforced on mutations.
- Magic links logged in non-production; OAuth needs real `AUTH_*` secrets.
- Payments/bookings are **sandbox only** — do not claim live inventory/GDS.
- Missing uploaded `04_CODEX_DEVELOPMENT_PLAYBOOK.md` (noted).

## Next hardening (post Feature Prompt library)

1. Postgres + migrations for identity/consent/trips/commerce.
2. Enforce admin auth + role checks.
3. Real PSP webhook secrets + reconciliation job worker.
4. Expand AI adversarial evals and metrics export.
