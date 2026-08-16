import { describe, expect, it, beforeEach } from 'vitest';
import {
  consumeMagicLinkToken,
  issueMagicLinkToken,
  listAccounts,
  resetIdentityStore,
  upsertAccountFromIdentity,
} from './store';

describe('identity store', () => {
  beforeEach(() => {
    resetIdentityStore();
  });

  it('issues and consumes magic-link tokens once', () => {
    const token = issueMagicLinkToken('Aroha@Example.com');
    expect(consumeMagicLinkToken(token)).toBe('aroha@example.com');
    expect(consumeMagicLinkToken(token)).toBeNull();
  });

  it('maps google and email identities onto one internal user when email matches', () => {
    const emailAccount = upsertAccountFromIdentity({
      provider: 'email',
      providerSubject: 'aroha@example.com',
      email: 'aroha@example.com',
      emailVerified: true,
    });
    const linked = upsertAccountFromIdentity({
      provider: 'google',
      providerSubject: 'google-42',
      email: 'aroha@example.com',
      emailVerified: true,
    });
    expect(linked.id.value).toBe(emailAccount.id.value);
    expect(linked.identities).toHaveLength(2);
    expect(listAccounts()).toHaveLength(1);
  });

  it('rejects unverified email collisions', () => {
    upsertAccountFromIdentity({
      provider: 'email',
      providerSubject: 'aroha@example.com',
      email: 'aroha@example.com',
      emailVerified: true,
    });
    expect(() =>
      upsertAccountFromIdentity({
        provider: 'apple',
        providerSubject: 'apple-9',
        email: 'aroha@example.com',
        emailVerified: false,
      }),
    ).toThrow(/verified method/i);
  });
});
