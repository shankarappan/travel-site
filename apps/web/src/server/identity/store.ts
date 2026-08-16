import { upsertAccountFromIdentityRepo, type IssueMagicLinkTokenInput } from '@travel/db';
import type { IdentityProvider, UserAccount } from '@travel/domain';
import { identityRepository } from '../persistence/repos';

export async function getAccountById(id: string): Promise<UserAccount | undefined> {
  return (await identityRepository().getById(id)) ?? undefined;
}

export async function saveAccount(account: UserAccount): Promise<UserAccount> {
  return identityRepository().save(account);
}

export async function issueMagicLinkToken(
  emailOrInput: string | IssueMagicLinkTokenInput,
  ttlMs?: number,
): Promise<string> {
  return identityRepository().issueMagicLinkToken(emailOrInput, ttlMs);
}

export async function consumeMagicLinkToken(token: string): Promise<string | null> {
  return identityRepository().consumeMagicLinkToken(token);
}

export async function upsertAccountFromIdentity(input: {
  provider: IdentityProvider;
  providerSubject: string;
  email: string | null;
  emailVerified: boolean;
}): Promise<UserAccount> {
  return upsertAccountFromIdentityRepo(identityRepository(), input);
}
