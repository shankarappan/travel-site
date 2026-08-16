# MVP Checklist (Phase 1)

Derived from the Technical Blueprint Definition of Done and Feature Prompt Library. Track progress as features land.

## Foundation

- [x] Monorepo scaffold (`apps/web`, `apps/admin`, shared packages)
- [x] TypeScript strict mode, lint, format, unit tests, CI
- [x] Environment validation + structured logging
- [x] Architecture README + modular-monolith ADR
- [x] Design system + responsive application shell (Prompt 02)

## Identity & privacy

- [x] Email/passwordless + Google + Apple auth with one internal user ID
- [x] Session handling, logout, account linking, role model
- [x] Consent ledger (transactional vs marketing) + withdrawal UX
- [x] Durable PostgreSQL persistence for identity + consent (append-only history)

## Discovery & trips

- [x] CMS-backed NZ destination content with SEO metadata
- [x] Saved trips / itinerary builder with server-side ownership
- [x] AI concierge read-only tools + conversation persistence + evals
- [x] Durable PostgreSQL persistence for trips + channel-agnostic conversations

## Commerce (sandbox only until proven)

- [x] Accommodation provider abstraction + fake/sandbox adapter
- [x] Accommodation search UX (mobile-first)
- [x] Quote snapshots + checkout review (no fake bookings)
- [x] Hosted/tokenized payments + webhook verification (sandbox)
- [x] Booking confirmation + reconciliation alerts
- [x] Transactional email templates (versioned intents)
- [x] Newsletter / voucher marketing gated by consent
- [x] Durable PostgreSQL persistence for orders/payments/webhooks/bookings

## Channels & ops

- [x] Unified conversation hub
- [x] WhatsApp / Telegram adapters + signature/opt-out/linking hooks
- [x] Voice tool gateway with confirmation for sensitive fields
- [x] Admin operations console scaffold (RBAC policy documented; enforcement still open)
- [x] Observability correlation IDs + runbooks + health endpoints
- [x] PWA hardening (manifest/SW; commercial APIs network-only)

## Deferred / stubs (explicit Phase 1 non-goals)

- [x] React Native/Expo package stub (Prompt 23) — activate after web APIs stabilize
- [x] Flights provider stub (Prompt 24) — empty until commercial access verified
- [x] Security/privacy launch audit doc (Prompt 25) — criticals still block production launch

## Explicit non-goals for Phase 1 production

- No live Booking.com / GDS production booking until sandbox + reconciliation proven
- No microservices / Kubernetes
- No native mobile app until responsive web + APIs are stable
- No promotional messaging without consent ledger

## CI gates required before merge

- Lint
- Typecheck
- Unit tests
- Build
- Format check
- Secrets must not be committed
