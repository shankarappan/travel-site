import { Button } from '@travel/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signOut } from '../../server/identity/auth';
import { getAccountById } from '../../server/identity/store';

export const metadata: Metadata = {
  title: 'Profile',
};

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const account = await getAccountById(session.user.id);
  const displayName = session.user.name?.trim() || session.user.email || 'Traveller';
  const providers =
    account?.identities.map((identity) => identity.provider).filter(Boolean) ??
    (session.user.email ? ['email'] : []);

  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-10 sm:px-6 sm:py-14">
      <p className="travel-caption">Your profile</p>
      <h1 className="travel-h1 mt-2 text-[var(--travel-color-ink)]">{displayName}</h1>
      <p className="mt-2 max-w-xl text-[var(--travel-color-ink-soft)]">
        Manage how you travel with Aotearoa Trails — trips, preferences and sign-in.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <section className="space-y-3">
          <h2 className="travel-h3 text-[var(--travel-color-ink)]">Account</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-[var(--travel-color-ink-muted)]">Email</dt>
              <dd className="mt-0.5 font-medium text-[var(--travel-color-ink)]">
                {session.user.email ?? 'Not set'}
              </dd>
            </div>
            <div>
              <dt className="text-[var(--travel-color-ink-muted)]">Signed in with</dt>
              <dd className="mt-0.5 font-medium capitalize text-[var(--travel-color-ink)]">
                {providers.length ? providers.join(' · ') : 'Session'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="space-y-3">
          <h2 className="travel-h3 text-[var(--travel-color-ink)]">Quick links</h2>
          <ul className="space-y-2 text-sm">
            <li>
              <Link
                href="/trips"
                className="font-medium text-[var(--travel-color-ocean)] no-underline hover:underline"
              >
                Your trips
              </Link>
            </li>
            <li>
              <Link
                href="/account/preferences"
                className="font-medium text-[var(--travel-color-ocean)] no-underline hover:underline"
              >
                Communication preferences
              </Link>
            </li>
            <li>
              <Link
                href="/concierge"
                className="font-medium text-[var(--travel-color-ocean)] no-underline hover:underline"
              >
                Ask the concierge
              </Link>
            </li>
          </ul>
        </section>
      </div>

      <form
        className="mt-12"
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
