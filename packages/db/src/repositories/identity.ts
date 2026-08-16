import {
  createUserAccount,
  createUserId,
  linkIdentity,
  normalizeEmail,
  resolveAccountForSignIn,
  type IdentityProvider,
  type LinkedIdentity,
  type Role,
  type UserAccount,
} from '@travel/domain';
import type { DbPool } from '../pool.js';
import type { IdentityRepository } from './types.js';

type UserRow = {
  id: string;
  primary_email: string | null;
  roles: string[];
  created_at: Date;
};

type IdentityRow = {
  provider: IdentityProvider;
  provider_subject: string;
  email: string | null;
  email_verified: boolean;
  linked_at: Date;
};

function mapAccount(user: UserRow, identities: IdentityRow[]): UserAccount {
  return {
    id: createUserId(user.id),
    primaryEmail: user.primary_email,
    roles: user.roles as Role[],
    identities: identities.map((identity): LinkedIdentity => ({
      provider: identity.provider,
      providerSubject: identity.provider_subject,
      email: identity.email,
      emailVerified: identity.email_verified,
      linkedAt: identity.linked_at.toISOString(),
    })),
    createdAt: user.created_at.toISOString(),
  };
}

export class PostgresIdentityRepository implements IdentityRepository {
  constructor(private readonly pool: DbPool) {}

  async getById(id: string): Promise<UserAccount | null> {
    const user = await this.pool.query<UserRow>('SELECT * FROM users WHERE id = $1', [id]);
    const row = user.rows[0];
    if (!row) return null;
    const identities = await this.pool.query<IdentityRow>(
      'SELECT provider, provider_subject, email, email_verified, linked_at FROM auth_identities WHERE user_id = $1 ORDER BY linked_at',
      [id],
    );
    return mapAccount(row, identities.rows);
  }

  async findByProviderSubject(
    provider: IdentityProvider,
    providerSubject: string,
  ): Promise<UserAccount | null> {
    const result = await this.pool.query<{ user_id: string }>(
      `SELECT user_id FROM auth_identities WHERE provider = $1 AND provider_subject = $2`,
      [provider, providerSubject],
    );
    const userId = result.rows[0]?.user_id;
    if (!userId) return null;
    return this.getById(userId);
  }

  async findByVerifiedEmail(email: string): Promise<UserAccount[]> {
    const normalized = normalizeEmail(email);
    const result = await this.pool.query<{ id: string }>(
      `
      SELECT DISTINCT u.id
      FROM users u
      LEFT JOIN auth_identities i ON i.user_id = u.id
      WHERE u.primary_email = $1
         OR (i.email = $1 AND i.email_verified = true)
      `,
      [normalized],
    );
    const accounts: UserAccount[] = [];
    for (const row of result.rows) {
      const account = await this.getById(row.id);
      if (account) accounts.push(account);
    }
    return accounts;
  }

  async save(account: UserAccount): Promise<UserAccount> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `
        INSERT INTO users (id, primary_email, roles, created_at, updated_at)
        VALUES ($1, $2, $3, $4::timestamptz, now())
        ON CONFLICT (id) DO UPDATE SET
          primary_email = EXCLUDED.primary_email,
          roles = EXCLUDED.roles,
          updated_at = now()
        `,
        [account.id.value, account.primaryEmail, [...account.roles], account.createdAt],
      );

      for (const identity of account.identities) {
        await client.query(
          `
          INSERT INTO auth_identities (
            id, user_id, provider, provider_subject, email, email_verified, linked_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7::timestamptz)
          ON CONFLICT (provider, provider_subject) DO UPDATE SET
            email = EXCLUDED.email,
            email_verified = EXCLUDED.email_verified,
            user_id = EXCLUDED.user_id
          `,
          [
            crypto.randomUUID(),
            account.id.value,
            identity.provider,
            identity.providerSubject,
            identity.email,
            identity.emailVerified,
            identity.linkedAt,
          ],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return (await this.getById(account.id.value)) ?? account;
  }

  async issueMagicLinkToken(email: string, ttlMs = 1000 * 60 * 20): Promise<string> {
    const token = crypto.randomUUID();
    const expiresAt = new Date(Date.now() + ttlMs).toISOString();
    await this.pool.query(
      `INSERT INTO magic_link_tokens (token, email, expires_at) VALUES ($1, $2, $3::timestamptz)`,
      [token, normalizeEmail(email), expiresAt],
    );
    return token;
  }

  async consumeMagicLinkToken(token: string): Promise<string | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{
        email: string;
        expires_at: Date;
        consumed_at: Date | null;
      }>(
        `SELECT email, expires_at, consumed_at FROM magic_link_tokens WHERE token = $1 FOR UPDATE`,
        [token],
      );
      const row = result.rows[0];
      if (!row || row.consumed_at || row.expires_at.getTime() < Date.now()) {
        await client.query('ROLLBACK');
        return null;
      }
      await client.query(`UPDATE magic_link_tokens SET consumed_at = now() WHERE token = $1`, [
        token,
      ]);
      await client.query('COMMIT');
      return row.email;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

export async function upsertAccountFromIdentityRepo(
  repo: IdentityRepository,
  input: {
    provider: IdentityProvider;
    providerSubject: string;
    email: string | null;
    emailVerified: boolean;
  },
): Promise<UserAccount> {
  const bySubject = await repo.findByProviderSubject(input.provider, input.providerSubject);
  const byEmail = input.email ? await repo.findByVerifiedEmail(input.email) : [];

  const accounts: UserAccount[] = [];
  if (bySubject) accounts.push(bySubject);
  for (const account of byEmail) {
    if (!accounts.some((item) => item.id.value === account.id.value)) {
      accounts.push(account);
    }
  }

  const resolution = resolveAccountForSignIn({
    accounts,
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
    return repo.save(linked);
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
  return repo.save(linked);
}
