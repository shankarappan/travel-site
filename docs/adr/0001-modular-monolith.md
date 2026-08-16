# ADR 0001: Modular monolith first

## Status

Accepted

## Context

The platform must support web, admin, messaging (WhatsApp/Telegram), voice (ElevenLabs), and later native mobile. A premature microservices split would increase operational cost before product-market fit and before clear team/ownership boundaries exist.

## Decision

Ship a TypeScript modular monolith in a single monorepo:

- `apps/*` host channel UIs and thin Next.js server entry points.
- `packages/domain` owns business rules and state machines.
- `packages/api-contracts` owns schemas shared by all channels.
- `packages/providers` isolates supplier SDKs behind normalized interfaces.
- `packages/ai` owns prompts, tool schemas and evals.
- `packages/observability` owns logging/tracing/env validation.

Deploy as one (or few) managed web applications with managed Postgres. Extract a service only when an ADR documents a concrete scale, reliability or team-ownership need.

## Consequences

### Positive

- Single deployable surface for MVP; lower ops cost.
- Shared types and domain policies across channels.
- Clear seams for later extraction without rewriting product logic.

### Negative / trade-offs

- Deploy coupling: a web UI change and a domain change ship together until extraction.
- Requires discipline to keep package boundaries clean (lint/import rules + code review).

## Alternatives considered

1. **Microservices from day one** — rejected; unjustified ops overhead for an early-stage product.
2. **Separate backend repo** — rejected; slows contract evolution between UI and domain.
3. **BFF-per-channel without shared domain** — rejected; duplicates booking/consent/payment rules.
