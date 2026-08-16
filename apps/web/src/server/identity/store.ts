import {
  createUserAccount,
  linkIdentity,
  normalizeEmail,
  resolveAccountForSignIn,
  type IdentityProvider,
  type UserAccount,
} from '@travel/domain';

/** Process-local store for MVP identity until Postgres/auth provider is wired. */
const accounts = new Map<string, UserAccount>();
const magicTokens = new Map<string, { email: string; expiresAt: number }>();

export function listAccounts(): UserAccount[] {
  return [...accounts.values()];
}

export function getAccountById(id: string): UserAccount | undefined {
  return accounts.get(id);
}

export function saveAccount(account: UserAccount): UserAccount {
  accounts.set(account.id.value, account);
  return account;
}

export function resetIdentityStore(): void {
  accounts.clear();
  magicTokens.clear();
}

export function issueMagicLinkToken(email: string, ttlMs = 1000 * 60 * 20): string {
  const token = crypto.randomUUID();
  magicTokens.set(token, {
    email: normalizeEmail(email),
    expiresAt: Date.now() + ttlMs,
  });
  return token;
}

export function consumeMagicLinkToken(token: string): string | null {
  const record = magicTokens.get(token);
  magicTokens.delete(token);
  if (!record) return null;
  if (record.expiresAt < Date.now()) return null;
  return record.email;
}

export function upsertAccountFromIdentity(input: {
  provider: IdentityProvider;
  providerSubject: string;
  email: string | null;
  emailVerified: boolean;
}): UserAccount {
  const resolution = resolveAccountForSignIn({
    accounts: listAccounts(),
    provider: input.provider,
    providerSubject: input.providerSubject,
    email: input.email,
    emailVerified: input.emailVerified,
  });

  if (resolution.action === 'conflict') {
    throw new Error(resolution.message);
  }

  if (resolution.action === 'create') {
    const created = createUserAccount({
      primaryEmail: input.emailVerified && input.email ? normalizeEmail(input.email) : null,
      identities: [],
    });
    const linked = linkIdentity(created, {
      provider: input.provider,
      providerSubject: input.providerSubject,
      email: input.email,
      emailVerified: input.emailVerified,
    });
    return saveAccount(linked);
  }

  const alreadyLinked = resolution.account.identities.some(
    (identity) =>
      identity.provider === input.provider && identity.providerSubject === input.providerSubject,
  );
  if (alreadyLinked) {
    return resolution.account;
  }

  const linked = linkIdentity(resolution.account, {
    provider: input.provider,
    providerSubject: input.providerSubject,
    email: input.email,
    emailVerified: input.emailVerified,
  });
  return saveAccount(linked);
}
