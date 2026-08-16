# Implementation plan (post Prompt 04 review)

Status: **planning complete — await go-ahead before Prompt 05+**
Sources of truth: Technical Blueprint v1.0, `docs/product/cursor-master-prompt.md`, Feature Prompt Library (uploaded), this checklist.

Working agreement for remaining work:
1. Re-read Master Prompt + relevant Blueprint sections before each Feature Prompt.
2. State the smallest change set, implement, add tests, run lint/typecheck/test/build.
3. One Feature Prompt at a time → review/test → then next.
4. No live Booking.com / payment production paths until sandbox + reconciliation proven.
5. Prefer durable Postgres-backed stores before multi-instance deploys (identity + consent are still in-memory).

---

## Review of Prompts 01–04 (what landed vs gaps)

### Prompt 01 — Repository foundation — **largely complete**
**Done:** monorepo (`apps/web`, `apps/admin`), packages domain/api-contracts/providers/ai/observability (+ later ui/consent), TS strict, ESLint, Prettier, Vitest, Turbo, CI, env validation, structured logs, architecture README, ADR 0001.
**Gaps / harden later:** no `04_CODEX_DEVELOPMENT_PLAYBOOK.md` was supplied (noted); secrets scanning not yet a CI step; OpenTelemetry is hooks-only (logs), not full tracing.

### Prompt 02 — Design system + shell — **complete for MVP**
**Done:** `@travel/ui` tokens, shell, nav, search entry, forms, dialog, skeleton, empty/error, reduced-motion, `/design-system` review surface, responsive hero.
**Gaps:** not Storybook (equivalent page used); a11y/visual regression snapshots not automated; admin UI does not yet share the design system.

### Prompt 03 — Identity — **functional MVP, not production-durable**
**Done:** Auth.js, magic-link passwordless, Google/Apple gated on server env, linking policy + tests, sessions, logout, roles on JWT, `/sign-in` `/account`, ADR 0002.
**Gaps:** identity store is **process-local memory** (not Postgres); magic links logged in dev rather than sent via transactional email; no MFA for admin; account-linking UX for explicit “link Google to existing email” is policy-backed but not a polished multi-step UI.

### Prompt 04 — Consent — **functional MVP, not production-durable**
**Done:** append-only events (purpose/source/policy/evidence/withdrawal), transactional vs marketing split, preferences UI, unsubscribe, admin `/consent`, audit-style logs, `@travel/consent`.
**Gaps:** in-memory ledger (web/admin processes do not share state); admin consent view is not RBAC-gated yet; no signed unsubscribe tokens (unguessable UUID only).

### Quality gates (verified this review)
`pnpm test` and `pnpm build` pass on current branch `cursor/mvp-foundation-design-system-b2cc` / PR #1.

---

## Remaining Feature Prompts (execute in order)

### Wave A — Discovery & trips (Blueprint §13, Phase 1 DoD)
| # | Prompt | Primary deliverables | Key Blueprint anchors |
| --- | --- | --- | --- |
| 05 | Destination content MVP | CMS-shaped content model, NZ destination templates, SEO metadata, image a11y/source fields, map hook placeholders | Catalog domain, SSR/SEO |
| 06 | Saved trips / itinerary | trips, days, items; CRUD + reorder; **server ownership checks** | Customer domain |
| 07 | AI concierge read-only | tool gateway (`get_destination`, `search_content`, `get_trip`, `suggest_itinerary`), prompt versions, rate limits, persistence, eval fixtures; no invented prices | AI orchestration §8 |

### Wave B — Commerce sandbox (Blueprint §5–6; no production booking claim)
| # | Prompt | Primary deliverables |
| --- | --- | --- |
| 08 | Accommodation provider abstraction | normalized search/offer/quote/book interfaces + **fake/sandbox adapter** + contract tests |
| 09 | Accommodation search UX | mobile-first search/results, filters/sort, URL state, expiry/error states |
| 10 | Quote + checkout foundation | immutable quotes, order state machine, reprice-before-pay, cancellation display |
| 11 | Payments | Stripe (or chosen PSP) hosted/tokenized UI, one intent per attempt, webhooks, reconciliation job |
| 12 | Booking confirmation + reconciliation | idempotent provider book, paid-but-unconfirmed alerts |
| 13 | Transactional email | versioned templates + delivery status (separate from marketing) |
| 14 | Newsletter / voucher marketing | consent-qualified segments only |

### Wave C — Channels & ops
| # | Prompt | Notes |
| --- | --- | --- |
| 15 | Conversation hub | channel-agnostic threads; no private data without verified link |
| 16–17 | WhatsApp / Telegram | official APIs, signatures, opt-out, linking |
| 18–19 | ElevenLabs voice | tool gateway + confirmation for high-impact; booking support only after core stable |
| 20 | Admin operations console | RBAC timelines, support queue, refunds with reason codes |
| 21 | Observability + runbooks | correlation IDs, metrics, alerts, runbooks |
| 22 | PWA hardening | CWV, secure caching (never stale prices/bookings) |

### Wave D — Explicitly later
| # | Prompt | Gate |
| --- | --- | --- |
| 23 | React Native | only after web + APIs stable |
| 24 | Flights | only after commercial access verified |
| 25 | Security/privacy launch audit | blocks launch on criticals |

---

## Cross-cutting work to insert before / during Wave A

These are not separate Feature Prompts but are required by the Blueprint and should land early so later prompts do not paint into a corner:

1. **Postgres + migrations** under `infra/migrations` — replace in-memory identity and consent stores.
2. **Repository interfaces** in domain/app services (auth, consent, catalog, trips) so adapters can move.
3. **Shared API route conventions** + zod contracts in `@travel/api-contracts` for trips/catalog/AI tools.
4. **Correlation ID middleware** (lightweight) ahead of Prompt 21 full observability.
5. **Copy Feature Prompt Library + note missing Codex playbook** into `docs/product/` for agent continuity.

---

## Proposed next execution slice (when approved)

**Stop condition for the next coding turn:** complete Prompt 05 only (destination content MVP), review/test, update checklist + PR — then pause for Prompt 06 unless told to continue the chain.

Prompt 05 smallest change set:
- Content types: Destination, Guide/Article (fields: slug, title, hero, highlights, body, SEO, image alt/source, map placeholder).
- File/JSON or MDX CMS for MVP (swap-ready interface; no hard-coded one-off pages).
- Routes: `/destinations`, `/destinations/[slug]`, optional `/guides/[slug]`.
- Reuse `@travel/ui` shell; WCAG-minded images; SSR metadata.
- Tests for content parsing/slug validation; build must pass.

---

## Risks already accepted in 01–04 (must not forget)

- In-memory identity/consent will lose data on restart and will not sync across web/admin processes.
- Google/Apple require real `AUTH_*` secrets to exercise OAuth E2E.
- Admin is not yet a secured RBAC surface.
- No real transactional email sender for magic links in production mode.
