import { createHash, randomBytes } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import { generateMagicLinkToken, hashMagicLinkToken } from './magic-link-token.js';

describe('magic-link-token helpers', () => {
  it('generates URL-safe high-entropy tokens', () => {
    const token = generateMagicLinkToken();
    expect(token.length).toBeGreaterThanOrEqual(40);
    expect(token).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(generateMagicLinkToken()).not.toBe(token);
  });

  it('hashes deterministically with sha256 hex', () => {
    const raw = randomBytes(16).toString('hex');
    expect(hashMagicLinkToken(raw)).toBe(createHash('sha256').update(raw, 'utf8').digest('hex'));
    expect(hashMagicLinkToken(raw)).toBe(hashMagicLinkToken(raw));
    expect(hashMagicLinkToken(raw)).not.toBe(raw);
  });
});
