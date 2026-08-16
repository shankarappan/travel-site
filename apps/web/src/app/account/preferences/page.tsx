import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { ConsentPreferencesForm } from '../../../components/consent-preferences-form';
import { auth } from '../../../server/identity/auth';
import {
  ensureTransactionalConsent,
  getConsentStatuses,
  issueUnsubscribeToken,
} from '../../../server/consent/store';
import type { ConsentPurpose } from '@travel/domain';

export const metadata: Metadata = {
  title: 'Communication preferences',
};

export default async function PreferencesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  await ensureTransactionalConsent(session.user.id);
  const statuses = await getConsentStatuses(session.user.id);
  const initial = Object.fromEntries(
    statuses.map((status) => [status.purpose, status.granted]),
  ) as Partial<Record<ConsentPurpose, boolean>>;

  const marketingToken = await issueUnsubscribeToken(session.user.id, 'marketing_email');

  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-10 sm:px-6 sm:py-14">
      <p className="travel-caption">Traveller care</p>
      <h1 className="travel-h1 mt-2 text-[var(--travel-color-ink)]">Communication preferences</h1>
      <p className="mt-2 mb-8 max-w-2xl text-[var(--travel-color-ink-soft)]">
        Choose what you’d like to hear from us. Booking and account messages stay available so we
        can support your trips.
      </p>
      <ConsentPreferencesForm initial={initial} />
      <p className="mt-8 text-sm text-[var(--travel-color-ink-soft)]">
        Prefer a direct exit from marketing email?{' '}
        <a
          className="font-medium text-[var(--travel-color-ocean)] underline-offset-2 hover:underline"
          href={`/unsubscribe?token=${marketingToken}`}
        >
          Unsubscribe from marketing email
        </a>
      </p>
    </div>
  );
}
