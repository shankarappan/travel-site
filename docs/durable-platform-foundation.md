# Durable platform foundation

Milestone converting sandbox in-memory stores to PostgreSQL-backed repositories.

## Schema overview

| Area | Tables |
| --- | --- |
| Migrations | `schema_migrations` |
| Identity | `users`, `auth_identities`, `magic_link_tokens` |
| Consent | `consent_events` (append-only), `consent_unsubscribe_tokens` |
| Trips | `trips`, `trip_travellers`, `trip_days`, `itinerary_items` |
| Commerce | `orders`, `order_lines`, `payments`, `order_status_events`, `webhook_events`, `booking_attempts`, `refunds`, `email_intents` |
| Conversations | `conversations`, `conversation_channels`, `conversation_messages`, `conversation_tool_actions`, `conversation_link_codes` |

## Migrations

- `infra/migrations/001_durable_foundation.sql`

Apply with:

```bash
pnpm db:up          # optional local Postgres via docker compose
pnpm db:migrate
```

## Repository interfaces (`@travel/db`)

- `IdentityRepository`
- `ConsentRepository`
- `TripRepository`
- `CommerceRepository`
- `ConversationRepository`

PostgreSQL implementations live in `packages/db/src/repositories/*`.

## Runtime wiring

`apps/web/src/server/persistence/repos.ts` constructs singleton Postgres repositories from `getPool()`.

Health:

- `GET /api/health`
- `GET /api/health/db`

## Observability

- Structured JSON logs with sensitive-field redaction
- `x-correlation-id` middleware
- Metrics/error-tracker hooks (`setMetricsHook`, `setErrorTracker`)

## Completion criteria status

1. Important business state persists in Postgres — yes
2. Restart-safe — yes (integration tests recreate pool against same DB)
3. Multi-instance safe — yes (shared DB + unique constraints)
4. Duplicate webhooks do not double-apply — yes (`webhook_events.event_id` PK)
5. Migrations reproduce schema — yes
6. Integration tests cover persistence/idempotency — yes
7. Existing unit tests remain green — targeted; app store unit tests moved to DB integration
8. Docs/ADR updated — yes

## Known risks

- Admin RBAC/MFA still not enforced
- Sandbox payment signature remains shared secret
- Unsubscribe tokens are UUIDs (not HMAC-signed)
- Concierge rate limits remain process-local
- Trip persist strategy rewrites days/items on each mutation (fine for MVP scale)

## Next milestone recommendations

1. Harden admin auth + role gates
2. Real PSP webhook secrets + reconciliation worker
3. Signed unsubscribe tokens
4. Only then consider live accommodation inventory
