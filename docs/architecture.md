# Architecture

New Zealand-first intelligent travel platform. One modular monolith serves web, admin, messaging, voice and future mobile clients through shared domain and API contracts.

## Principles

- API-first: every channel uses the same backend capabilities.
- Domain ownership is explicit (Identity, Customer, Consent, Catalog, Search, Quote, Order, Booking, Payment, Conversation, Notification, Support, Audit).
- Provider-specific payloads stay behind adapters in `@travel/providers`.
- AI orchestrates via validated tools; it is never the system of record for money or bookings.
- Start as a modular monolith — extract services only with an ADR.

## Repository layout

```
apps/
  web/                 # Customer-facing Next.js PWA
  admin/               # Operations console
packages/
  domain/              # Entities, value objects, policies
  api-contracts/       # Zod schemas and shared API types
  providers/           # Accommodation, payment, messaging adapters
  ai/                  # Prompts, tool schemas, evals, guardrails
  observability/       # Logging, env validation, tracing helpers
  ui/                  # Design tokens and shared UI primitives
infra/
  migrations/
  deployment/
docs/
  adr/
  product/
  runbooks/
```

## Runtime stack (MVP)

| Layer | Choice |
| --- | --- |
| Web | Next.js + React + TypeScript |
| UI | Tailwind + accessible headless patterns + design tokens |
| Data | PostgreSQL (managed) |
| Auth | Managed auth with internal identity mapping |
| Payments | Hosted/tokenized PSP UI |
| Observability | Structured logs + OpenTelemetry-compatible hooks |

## Working agreements

1. Inspect existing architecture before changing code.
2. Prefer the smallest change set that satisfies the requirement.
3. Keep domain logic out of React components and provider SDK wrappers.
4. Validate external input with schemas from `@travel/api-contracts`.
5. Never commit secrets or expose server keys to clients.

See [ADR 0001](./adr/0001-modular-monolith.md) and the [MVP checklist](./mvp-checklist.md).
