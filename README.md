# Aotearoa Trails

New Zealand-first intelligent travel platform (modular monolith).

## Quick start

```bash
pnpm install
pnpm db:migrate
pnpm build
pnpm --filter @travel/web dev
```

Admin app: `pnpm --filter @travel/admin dev` (port 3001).

Public staging (any device): see [Public staging deploy](./docs/public-staging-deploy.md).

## Documentation

- [Architecture](./docs/architecture.md)
- [Durable platform foundation](./docs/durable-platform-foundation.md)
- [MVP checklist](./docs/mvp-checklist.md)
- [ADR 0001 — Modular monolith](./docs/adr/0001-modular-monolith.md)
- [Master prompt](./docs/product/cursor-master-prompt.md)

## Packages

| Package | Purpose |
| --- | --- |
| `@travel/domain` | Entities, money, order state machine |
| `@travel/api-contracts` | Zod schemas shared by channels |
| `@travel/db` | Postgres pool, migrations, repositories |
| `@travel/providers` | Supplier adapter interfaces |
| `@travel/ai` | Prompt registry and tool schemas |
| `@travel/observability` | Env validation + structured logging |
| `@travel/consent` | Append-only consent ledger + send policy helpers |
| `@travel/ui` | Design tokens and accessible UI primitives |
