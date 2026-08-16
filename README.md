# Aotearoa Trails

New Zealand-first intelligent travel platform (modular monolith).

## Quick start

```bash
pnpm install
pnpm build
pnpm test
pnpm --filter @travel/web dev
```

Admin app: `pnpm --filter @travel/admin dev` (port 3001).

## Documentation

- [Architecture](./docs/architecture.md)
- [MVP checklist](./docs/mvp-checklist.md)
- [ADR 0001 — Modular monolith](./docs/adr/0001-modular-monolith.md)
- [Master prompt](./docs/product/cursor-master-prompt.md)

## Packages

| Package | Purpose |
| --- | --- |
| `@travel/domain` | Entities, money, order state machine |
| `@travel/api-contracts` | Zod schemas shared by channels |
| `@travel/providers` | Supplier adapter interfaces |
| `@travel/ai` | Prompt registry and tool schemas |
| `@travel/observability` | Env validation + structured logging |
| `@travel/consent` | Append-only consent ledger + send policy helpers |
| `@travel/ui` | Design tokens and accessible UI primitives |
