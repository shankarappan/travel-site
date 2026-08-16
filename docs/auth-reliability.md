# Auth reliability (staging)

## Root causes fixed in code

1. **No email transport** — `request-magic-link` claimed delivery without sending mail.
2. **Raw tokens in DB** — now SHA-256 hashed at rest; raw value only in the emailed URL (and non-prod `devMagicLink`).
3. **Non-canonical verify URLs** — links now prefer `AUTH_URL` / `NEXT_PUBLIC_APP_URL`.
4. **Google/Apple advertised when unconfigured** — UI only shows providers that are fully enabled.

## Owner actions still required on Vercel

| Variable | Purpose |
| --- | --- |
| `AUTH_URL` | `https://travel-site-chi-five.vercel.app` |
| `RESEND_API_KEY` | Resend API key |
| `EMAIL_FROM` | Verified sender, e.g. `Aotearoa Trails <noreply@yourdomain.com>` |
| `AUTH_GOOGLE_ID` | Google Cloud OAuth client ID |
| `AUTH_GOOGLE_SECRET` | Google Cloud OAuth client secret |

Google Cloud Console → Credentials → OAuth 2.0 Client:

- **Authorized JavaScript origins:** `https://travel-site-chi-five.vercel.app`
- **Authorized redirect URIs:** `https://travel-site-chi-five.vercel.app/api/auth/callback/google`

After setting env vars, redeploy and run migrations (`002_auth_reliability.sql`) against the staging `DATABASE_URL`.

## Local smoke

```bash
export DATABASE_URL=postgresql://travel:travel@127.0.0.1:5432/travel
pnpm db:migrate
pnpm --filter @travel/web dev
# other terminal:
BASE_URL=http://localhost:3000 pnpm exec tsx scripts/smoke-auth-magic-link.ts
```
