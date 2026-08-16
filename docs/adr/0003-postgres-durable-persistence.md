# ADR 0003 — PostgreSQL durable persistence

- Status: Accepted
- Date: 2026-08-16

## Context

MVP Feature Prompts 01–25 stored identity, consent, trips, commerce, and conversations in process memory. That blocked multi-instance staging, restart durability, and idempotent webhook handling.

## Decision

Introduce `@travel/db` as the persistence boundary for the modular monolith:

- `pg` connection pool + `DATABASE_URL`
- SQL migrations under `infra/migrations`
- Repository interfaces with PostgreSQL implementations
- Application stores in `apps/web` are thin async facades over repositories
- Domain packages remain SQL-free

Consent remains append-only event history; current status is materialized in application code.

Commerce webhook event IDs and booking/order idempotency keys are enforced with unique constraints.

## Consequences

- Local/CI require PostgreSQL (`docker compose` or managed instance)
- Admin and web share the same database
- In-memory ledgers are retained only inside `@travel/consent` unit tests, not app runtime
- Live Booking.com/GDS/messaging providers remain out of scope for this milestone
