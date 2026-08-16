import { createHash, randomBytes } from 'node:crypto';

/** Hash a magic-link secret for durable storage. Never store the raw token. */
export function hashMagicLinkToken(rawToken: string): string {
  return createHash('sha256').update(rawToken, 'utf8').digest('hex');
}

/** Cryptographically strong, URL-safe magic-link secret. */
export function generateMagicLinkToken(): string {
  return randomBytes(32).toString('base64url');
}
