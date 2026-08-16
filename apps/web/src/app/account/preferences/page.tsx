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
      <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)]">
        Communication preferences
      </h1>
      <p className="mt-2 mb-8 max-w-2xl text-[var(--travel-color-ink-soft)]">
        Choose marketing channels separately from transactional booking messages. Withdrawal is
        recorded in an append-only consent ledger.
      </p>
      <ConsentPreferencesForm initial={initial} />
      <p className="mt-8 text-sm text-[var(--travel-color-ink-soft)]">
        One-click marketing email unsubscribe (dev token):{' '}
        <a className="underline" href={`/unsubscribe?token=${marketingToken}`}>
          Unsubscribe from marketing email
        </a>
      </p>
    </div>
  );
}
