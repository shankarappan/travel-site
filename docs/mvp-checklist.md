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
- [ ] Consent ledger (transactional vs marketing) + withdrawal UX

## Discovery & trips

- [ ] CMS-backed NZ destination content with SEO metadata
- [ ] Saved trips / itinerary builder with server-side ownership
- [ ] AI concierge read-only tools + conversation persistence + evals

## Commerce (sandbox only until proven)

- [ ] Accommodation provider abstraction + fake/sandbox adapter
- [ ] Accommodation search UX (mobile-first)
- [ ] Quote snapshots + checkout review (no fake bookings)
- [ ] Hosted/tokenized payments + webhook verification
- [ ] Booking confirmation + reconciliation alerts
- [ ] Transactional email templates (versioned)

## Channels & ops

- [ ] Unified conversation hub
- [ ] Admin operations console (RBAC)
- [ ] Observability correlation IDs, metrics, runbooks
- [ ] PWA hardening / Core Web Vitals budgets

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
