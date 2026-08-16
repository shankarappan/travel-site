import { Button, Card } from '@travel/ui';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth, signOut } from '../../server/identity/auth';
import { getAccountById } from '../../server/identity/store';

export const metadata: Metadata = {
  title: 'Account',
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const account = await getAccountById(session.user.id);

  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)]">
        Account
      </h1>
      <p className="mt-2 mb-8 text-[var(--travel-color-ink-soft)]">
        Signed in as {session.user.email ?? 'traveller'} · internal ID {session.user.id}
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <h2 className="text-lg font-semibold">Roles</h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-[var(--travel-color-ink-soft)]">
            {(session.user.roles ?? ['customer']).map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </Card>
        <Card>
          <h2 className="text-lg font-semibold">Linked identities</h2>
          {account?.identities.length ? (
            <ul className="mt-3 space-y-2 text-sm text-[var(--travel-color-ink-soft)]">
              {account.identities.map((identity) => (
                <li key={`${identity.provider}:${identity.providerSubject}`}>
                  <span className="font-medium text-[var(--travel-color-ink)]">
                    {identity.provider}
                  </span>
                  {identity.email ? ` · ${identity.email}` : ''}
                  {identity.emailVerified ? ' · verified' : ''}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-[var(--travel-color-ink-soft)]">
              Identity details will appear after the next sign-in against a durable store.
            </p>
          )}
        </Card>
      </div>

      <p className="mt-6">
        <a
          href="/account/preferences"
          className="text-sm font-semibold text-[var(--travel-color-fern)] underline-offset-2 hover:underline"
        >
          Communication preferences
        </a>
      </p>

      <form
        className="mt-8"
        action={async () => {
          'use server';
          await signOut({ redirectTo: '/' });
        }}
      >
        <Button type="submit" variant="secondary">
          Sign out
        </Button>
      </form>
    </div>
  );
}
