# Security and privacy launch audit (Prompt 25)

Date: 2026-08-16 · Scope: current modular-monolith MVP

## Critical (block launch)

| Finding | Status | Remediation |
| --- | --- | --- |
| Identity + consent + trips + commerce stores are in-memory | Open | Move to Postgres with migrations before multi-instance production |
| Admin console lacks enforced MFA/RBAC on mutations | Open | Add auth gate + role checks + reason codes on refunds/exports |
| Magic-link auth logs links in non-production; no hardened email sender | Open | Wire transactional email provider; never log full links in production |
| WhatsApp signature bypass allowed outside production | Accepted for sandbox | Require signature always in staging/production |
| No dependency vulnerability gate in CI | Open | Add `pnpm audit` / OSV scanner to CI |

## High

| Finding | Remediation |
| --- | --- |
| Unsubscribe tokens are raw UUIDs | Sign tokens (HMAC) with expiry |
| PWA service worker is basic | Expand installability testing; keep commercial APIs network-only |
| Correlation IDs present; metrics/alerts incomplete | Finish Prompt 21 metric export + paging |
| Cross-border processor review not documented | Inventory AI/PSP/messaging processors for NZ privacy |

## Medium

| Finding | Remediation |
| --- | --- |
| Prompt injection defenses are allow-list tools only | Add retrieval isolation tests + adversarial evals |
| Backup/restore untested | Schedule restore drill once Postgres lands |
| Rate limits are process-local | Move to Redis-compatible store when scaling |

## Launch posture

Do **not** expose production booking/payment until: sandbox payments, webhook verification, reconciliation alerts, and durable storage are proven.
