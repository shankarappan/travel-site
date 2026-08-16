import { createUserId, type Role, type UserId } from './user.js';

export type IdentityProvider = 'email' | 'google' | 'apple';

export interface LinkedIdentity {
  readonly provider: IdentityProvider;
  readonly providerSubject: string;
  readonly email: string | null;
  readonly emailVerified: boolean;
  readonly linkedAt: string;
}

export interface UserAccount {
  readonly id: UserId;
  readonly primaryEmail: string | null;
  readonly roles: readonly Role[];
  readonly identities: readonly LinkedIdentity[];
  readonly createdAt: string;
}

export interface SessionRecord {
  readonly sessionId: string;
  readonly userId: UserId;
  readonly expiresAt: string;
  readonly createdAt: string;
}

export class AccountLinkingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AccountLinkingError';
  }
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function createUserAccount(input: {
  id?: string;
  primaryEmail?: string | null;
  roles?: readonly Role[];
  identities?: readonly LinkedIdentity[];
  now?: Date;
}): UserAccount {
  const createdAt = (input.now ?? new Date()).toISOString();
  return {
    id: createUserId(input.id ?? cryptoRandomId()),
    primaryEmail: input.primaryEmail ? normalizeEmail(input.primaryEmail) : null,
    roles: input.roles ?? ['customer'],
    identities: input.identities ?? [],
    createdAt,
  };
}

export function findIdentity(
  user: UserAccount,
  provider: IdentityProvider,
  providerSubject: string,
): LinkedIdentity | undefined {
  return user.identities.find(
    (identity) => identity.provider === provider && identity.providerSubject === providerSubject,
  );
}

/**
 * Link a new identity to an existing account.
 * - Rejects if the identity is already present on another account (caller checks store).
 * - Allows same provider+subject only once per account.
 * - Verified emails may become primary when the account has none.
 */
export function linkIdentity(
  user: UserAccount,
  identity: Omit<LinkedIdentity, 'linkedAt'> & { linkedAt?: string },
  options?: { now?: Date },
): UserAccount {
  if (findIdentity(user, identity.provider, identity.providerSubject)) {
    throw new AccountLinkingError('Identity is already linked to this account');
  }

  const linked: LinkedIdentity = {
    provider: identity.provider,
    providerSubject: identity.providerSubject,
    email: identity.email ? normalizeEmail(identity.email) : null,
    emailVerified: identity.emailVerified,
    linkedAt: identity.linkedAt ?? (options?.now ?? new Date()).toISOString(),
  };

  const primaryEmail =
    user.primaryEmail ?? (linked.emailVerified && linked.email ? linked.email : user.primaryEmail);

  return {
    ...user,
    primaryEmail,
    identities: [...user.identities, linked],
  };
}

/**
 * Resolve which account should own a sign-in attempt.
 * Prefer exact provider subject match, then verified-email match, else create.
 */
export function resolveAccountForSignIn(input: {
  accounts: readonly UserAccount[];
  provider: IdentityProvider;
  providerSubject: string;
  email: string | null;
  emailVerified: boolean;
}):
  | { action: 'use'; account: UserAccount }
  | { action: 'create' }
  | { action: 'conflict'; message: string } {
  const bySubject = input.accounts.find((account) =>
    Boolean(findIdentity(account, input.provider, input.providerSubject)),
  );
  if (bySubject) {
    return { action: 'use', account: bySubject };
  }

  if (input.email && input.emailVerified) {
    const normalized = normalizeEmail(input.email);
    const byEmail = input.accounts.filter(
      (account) =>
        account.primaryEmail === normalized ||
        account.identities.some(
          (identity) => identity.emailVerified && identity.email === normalized,
        ),
    );

    if (byEmail.length > 1) {
      return {
        action: 'conflict',
        message: 'Multiple accounts share this verified email; manual support merge required',
      };
    }

    if (byEmail.length === 1) {
      const account = byEmail[0];
      if (!account) {
        return { action: 'create' };
      }
      return { action: 'use', account };
    }
  }

  if (input.email && !input.emailVerified) {
    const normalized = normalizeEmail(input.email);
    const existing = input.accounts.find((account) => account.primaryEmail === normalized);
    if (existing) {
      return {
        action: 'conflict',
        message:
          'An account already uses this email. Sign in with a verified method before linking.',
      };
    }
  }

  return { action: 'create' };
}

export function hasRole(user: UserAccount, role: Role): boolean {
  return user.roles.includes(role) || user.roles.includes('administrator');
}

export function isSessionActive(session: SessionRecord, now: Date = new Date()): boolean {
  return Date.parse(session.expiresAt) > now.getTime();
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `user_${Math.random().toString(36).slice(2, 10)}`;
}
