# ADR 0002: Auth.js for web identity

## Status

Accepted (amended 2026-08 for durable tokens + email delivery)

## Context

Phase 1 requires email/passwordless plus Google and Apple identities mapped to one internal user ID, with server-side sessions and no OAuth secrets in client bundles.

## Decision

Use Auth.js (next-auth v5) in `apps/web` with:

- JWT sessions for the MVP (short-lived, httpOnly cookies via Auth.js).
- Passwordless email via first-party magic-link issuance + Credentials provider consumption.
- Magic-link secrets hashed at rest in Postgres (`magic_link_tokens.token_hash`), single-use atomic consume (`SELECT … FOR UPDATE`), 20-minute TTL, and per-email/IP rate limits.
- Canonical verify URLs from `AUTH_URL` / `NEXT_PUBLIC_APP_URL` (not raw internal request hosts).
- Transactional delivery via Resend (`RESEND_API_KEY` + `EMAIL_FROM`). Dev-only `devMagicLink` response field when `NODE_ENV !== 'production'`.
- Google and Apple providers enabled only when **both** server env credentials exist; UI hides providers that are not configured.
- Domain account-linking policy in `@travel/domain`, persisted by `@travel/db` Postgres repositories.

## Consequences

- OAuth client secrets remain server-only.
- Production magic links require Resend configuration; anti-enumeration responses stay generic even if delivery fails.
- Google SSO requires console redirect URI `{AUTH_URL}/api/auth/callback/google` plus `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET`.
- Apple remains optional behind `AUTH_APPLE_ID` / `AUTH_APPLE_SECRET`.
