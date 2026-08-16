import type { IdentityProvider } from '@travel/domain';
import { createLogger } from '@travel/observability';
import NextAuth from 'next-auth';
import type { Provider } from 'next-auth/providers';
import Apple from 'next-auth/providers/apple';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import { consumeMagicLinkToken, upsertAccountFromIdentity } from './store';

const logger = createLogger({ service: 'web-auth' });

function mapProvider(providerId: string | undefined): IdentityProvider {
  if (providerId === 'google') return 'google';
  if (providerId === 'apple') return 'apple';
  return 'email';
}

const providers: Provider[] = [
  Credentials({
    id: 'magic-link',
    name: 'Email magic link',
    credentials: {
      token: { label: 'Token', type: 'text' },
    },
    async authorize(credentials) {
      const token = typeof credentials?.token === 'string' ? credentials.token : '';
      const email = await consumeMagicLinkToken(token);
      if (!email) {
        return null;
      }
      const account = await upsertAccountFromIdentity({
        provider: 'email',
        providerSubject: email,
        email,
        emailVerified: true,
      });
      return {
        id: account.id.value,
        email: account.primaryEmail ?? email,
        name: account.primaryEmail ?? email,
      };
    },
  }),
];

if (process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET) {
  providers.push(
    Apple({
      clientId: process.env.AUTH_APPLE_ID,
      clientSecret: process.env.AUTH_APPLE_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? 'development-only-auth-secret-change-me',
  session: { strategy: 'jwt', maxAge: 60 * 60 * 24 * 14 },
  pages: {
    signIn: '/sign-in',
  },
  providers,
  callbacks: {
    async signIn({ user, account }) {
      if (!account) return false;
      if (account.provider === 'magic-link') return true;
      try {
        await upsertAccountFromIdentity({
          provider: mapProvider(account.provider),
          providerSubject: account.providerAccountId,
          email: user.email ?? null,
          emailVerified: Boolean(user.email),
        });
        return true;
      } catch (error) {
        logger.warn('sign-in blocked by account linking policy', {
          message: error instanceof Error ? error.message : 'unknown',
        });
        return false;
      }
    },
    async jwt({ token, account, user }) {
      if (account?.provider === 'magic-link' && user?.id) {
        token.internalUserId = user.id;
        token.roles = ['customer'];
        return token;
      }
      if (account && user) {
        const internal = await upsertAccountFromIdentity({
          provider: mapProvider(account.provider),
          providerSubject: account.providerAccountId,
          email: user.email ?? null,
          emailVerified: Boolean(user.email),
        });
        token.internalUserId = internal.id.value;
        token.roles = [...internal.roles];
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = String(token.internalUserId ?? token.sub ?? '');
        session.user.roles = Array.isArray(token.roles) ? (token.roles as string[]) : ['customer'];
      }
      return session;
    },
  },
});
