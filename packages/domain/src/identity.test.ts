import { describe, expect, it } from 'vitest';
import {
  AccountLinkingError,
  createUserAccount,
  createUserId,
  hasRole,
  isSessionActive,
  linkIdentity,
  resolveAccountForSignIn,
} from './index.js';

describe('createUserId', () => {
  it('trims and accepts non-empty ids', () => {
    expect(createUserId('  user_1 ').value).toBe('user_1');
  });

  it('rejects empty ids', () => {
    expect(() => createUserId('   ')).toThrow(/empty/i);
  });
});

describe('account linking', () => {
  it('links google identity and sets primary email when verified', () => {
    const user = createUserAccount({ id: 'u1', primaryEmail: null });
    const linked = linkIdentity(user, {
      provider: 'google',
      providerSubject: 'google-sub-1',
      email: 'Aroha@Example.com',
      emailVerified: true,
    });
    expect(linked.primaryEmail).toBe('aroha@example.com');
    expect(linked.identities).toHaveLength(1);
  });

  it('rejects duplicate identity on the same account', () => {
    const user = linkIdentity(createUserAccount({ id: 'u1' }), {
      provider: 'email',
      providerSubject: 'aroha@example.com',
      email: 'aroha@example.com',
      emailVerified: true,
    });
    expect(() =>
      linkIdentity(user, {
        provider: 'email',
        providerSubject: 'aroha@example.com',
        email: 'aroha@example.com',
        emailVerified: true,
      }),
    ).toThrow(AccountLinkingError);
  });

  it('reuses account by provider subject', () => {
    const existing = linkIdentity(createUserAccount({ id: 'u1' }), {
      provider: 'apple',
      providerSubject: 'apple-1',
      email: 'a@example.com',
      emailVerified: true,
    });
    const result = resolveAccountForSignIn({
      accounts: [existing],
      provider: 'apple',
      providerSubject: 'apple-1',
      email: 'a@example.com',
      emailVerified: true,
    });
    expect(result.action).toBe('use');
  });

  it('links via verified email to a single matching account', () => {
    const existing = createUserAccount({
      id: 'u1',
      primaryEmail: 'aroha@example.com',
    });
    const result = resolveAccountForSignIn({
      accounts: [existing],
      provider: 'google',
      providerSubject: 'google-new',
      email: 'aroha@example.com',
      emailVerified: true,
    });
    expect(result).toEqual({ action: 'use', account: existing });
  });

  it('blocks unverified email colliding with an existing account', () => {
    const existing = createUserAccount({
      id: 'u1',
      primaryEmail: 'aroha@example.com',
    });
    const result = resolveAccountForSignIn({
      accounts: [existing],
      provider: 'email',
      providerSubject: 'aroha@example.com',
      email: 'aroha@example.com',
      emailVerified: false,
    });
    expect(result.action).toBe('conflict');
  });

  it('creates a new account when no match exists', () => {
    const result = resolveAccountForSignIn({
      accounts: [],
      provider: 'google',
      providerSubject: 'g-1',
      email: 'new@example.com',
      emailVerified: true,
    });
    expect(result.action).toBe('create');
  });
});

describe('roles and sessions', () => {
  it('treats administrator as superseding role checks', () => {
    const admin = createUserAccount({ id: 'a1', roles: ['administrator'] });
    expect(hasRole(admin, 'finance')).toBe(true);
  });

  it('detects expired sessions', () => {
    expect(
      isSessionActive(
        {
          sessionId: 's1',
          userId: createUserId('u1'),
          createdAt: '2026-01-01T00:00:00.000Z',
          expiresAt: '2026-01-02T00:00:00.000Z',
        },
        new Date('2026-01-03T00:00:00.000Z'),
      ),
    ).toBe(false);
  });
});
