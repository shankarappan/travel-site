# Public staging deploy (any device)

Goal: put the customer web app on a public `https://…vercel.app` URL so you can test from phone/desktop.

## Why localhost failed in Cloud Agent

The agent VM is remote. Your browser’s `localhost` is your machine. A Vercel deploy gives a shared public URL.

## Prerequisites

1. A [Vercel](https://vercel.com) account (free is fine)
2. A hosted Postgres URL (any of these):
   - [Neon](https://neon.tech) free project → copy connection string
   - Vercel Storage → Postgres
   - Supabase / Railway Postgres
3. This branch pushed: `cursor/durable-platform-foundation-b2cc`

## Option A — Vercel Dashboard (fastest)

1. Open https://vercel.com/new
2. Import `shankarappan/travel-site`
3. Configure project:
   - **Framework:** Next.js
   - **Root Directory:** `apps/web`
   - **Install Command:** `cd ../.. && pnpm install --frozen-lockfile`
   - **Build Command:** `cd ../.. && pnpm turbo run build --filter=@travel/web`
4. Set **Environment Variables** (Production + Preview):

| Name | Example |
| --- | --- |
| `DATABASE_URL` | `postgresql://…` from Neon/Vercel Postgres |
| `AUTH_SECRET` | long random string |
| `NEXT_PUBLIC_APP_URL` | your Vercel URL, e.g. `https://travel-site-….vercel.app` |
| `NEXT_PUBLIC_ADMIN_URL` | same as app URL for now (admin is separate) |
| `LOG_LEVEL` | `info` |
| `NODE_ENV` | `production` |

5. Deploy
6. After first deploy succeeds, run migrations against that DB:

```bash
export DATABASE_URL='postgresql://…same as Vercel…'
pnpm db:migrate
```

(Or use Neon SQL editor to paste `infra/migrations/001_durable_foundation.sql` once.)

7. Open the Vercel URL on any device. Check `/api/health` and `/api/health/db`.

## Option B — Cursor Desktop + Vercel MCP

1. In Cursor Desktop: **Settings → MCP → Vercel → Connect / Authenticate**
2. Come back to this chat and ask to “deploy the web app to Vercel”
3. The agent can then create/link the project and print the public URL

## Smoke test on the public URL

- `/` landing
- `/api/health` and `/api/health/db`
- `/destinations`, `/sign-in` (magic link appears in Vercel function logs in sandbox/dev-style setups — for production email you still need a mail provider)
- `/search` → checkout sandbox flow (sign-in required)

## Notes

- This deploys **web only**. Admin stays local unless you add a second Vercel project for `apps/admin`.
- Do not use live Booking.com/Stripe production keys for this pass.
- Keep `AUTH_SECRET` and `DATABASE_URL` server-only (never `NEXT_PUBLIC_`).
