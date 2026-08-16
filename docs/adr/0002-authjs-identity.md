# ADR 0002: Auth.js for web identity

## Status

Accepted

## Context

Phase 1 requires email/passwordless plus Google and Apple identities mapped to one internal user ID, with server-side sessions and no OAuth secrets in client bundles.

## Decision

Use Auth.js (next-auth v5) in `apps/web` with:

- JWT sessions for the MVP (short-lived, httpOnly cookies via Auth.js).
- Passwordless email via first-party magic-link issuance + Credentials provider consumption (avoids requiring a DB adapter before Postgres is wired).
- Google and Apple providers enabled only when server env credentials exist.
- Domain account-linking policy in `@travel/domain`, with an in-memory store until a durable identity repository is connected.

## Consequences

- OAuth client secrets remain server-only.
- Magic links work in local/dev without SMTP; production must add a transactional email sender.
- In-memory identity storage is process-local — replace before multi-instance production.
