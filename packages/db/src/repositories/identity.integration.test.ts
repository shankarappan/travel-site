import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  closePool,
  createPool,
  hasDatabaseUrl,
  hashMagicLinkToken,
  migrate,
  PostgresIdentityRepository,
  resetDatabaseForTests,
  type DbPool,
} from '../index.js';

const describeDb = hasDatabaseUrl() ? describe : describe.skip;

describeDb('identity magic links (integration)', () => {
  let pool: DbPool;
  let identity: PostgresIdentityRepository;

  beforeAll(async () => {
    pool = createPool();
    await resetDatabaseForTests(pool);
    await migrate(pool);
    identity = new PostgresIdentityRepository(pool);
  });

  beforeEach(async () => {
    await resetDatabaseForTests(pool);
    await migrate(pool);
    identity = new PostgresIdentityRepository(pool);
  });

  afterAll(async () => {
    await pool.end();
    await closePool();
  });

  it('stores only the hash and normalizes email', async () => {
    const raw = await identity.issueMagicLinkToken({
      email: 'Aroha@Example.com',
      requestIp: '203.0.113.10',
    });
    const stored = await pool.query<{ token_hash: string; email: string; request_ip: string }>(
      'SELECT token_hash, email, request_ip FROM magic_link_tokens',
    );
    expect(stored.rows).toHaveLength(1);
    expect(stored.rows[0]?.email).toBe('aroha@example.com');
    expect(stored.rows[0]?.request_ip).toBe('203.0.113.10');
    expect(stored.rows[0]?.token_hash).toBe(hashMagicLinkToken(raw));
    expect(stored.rows[0]?.token_hash).not.toBe(raw);
  });

  it('consumes once and rejects reuse/expiry/unknown', async () => {
    const token = await identity.issueMagicLinkToken('once@example.com');
    expect(await identity.consumeMagicLinkToken(token)).toBe('once@example.com');
    expect(await identity.consumeMagicLinkToken(token)).toBeNull();
    expect(await identity.consumeMagicLinkToken('not-a-real-token-value-xx')).toBeNull();

    const expired = await identity.issueMagicLinkToken({
      email: 'expired@example.com',
      ttlMs: 1,
    });
    await new Promise((resolve) => setTimeout(resolve, 5));
    expect(await identity.consumeMagicLinkToken(expired)).toBeNull();
  });

  it('consumes atomically under concurrent callers', async () => {
    const token = await identity.issueMagicLinkToken('race@example.com');
    const results = await Promise.all(
      Array.from({ length: 8 }, () => identity.consumeMagicLinkToken(token)),
    );
    expect(results.filter((value) => value === 'race@example.com')).toHaveLength(1);
    expect(results.filter((value) => value === null)).toHaveLength(7);
  });

  it('counts recent requests for rate limiting', async () => {
    await identity.issueMagicLinkToken({ email: 'limit@example.com', requestIp: '198.51.100.1' });
    await identity.issueMagicLinkToken({ email: 'limit@example.com', requestIp: '198.51.100.1' });
    await identity.issueMagicLinkToken({ email: 'other@example.com', requestIp: '198.51.100.1' });

    expect(
      await identity.countRecentMagicLinkRequests({
        email: 'limit@example.com',
        windowMs: 60_000,
      }),
    ).toBe(2);
    expect(
      await identity.countRecentMagicLinkRequests({
        requestIp: '198.51.100.1',
        windowMs: 60_000,
      }),
    ).toBe(3);
  });
});
