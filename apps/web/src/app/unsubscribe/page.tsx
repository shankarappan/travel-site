import type { Metadata } from 'next';
import { withdrawByUnsubscribeToken } from '../../server/consent/store';

export const metadata: Metadata = {
  title: 'Unsubscribe',
};

export default async function UnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const params = await searchParams;
  const token = params.token;
  const event = token ? await withdrawByUnsubscribeToken(token) : null;

  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)]">
        Unsubscribe
      </h1>
      {event ? (
        <p className="mt-4 max-w-xl text-[var(--travel-color-ink-soft)]">
          You have been unsubscribed from {event.purpose.replaceAll('_', ' ')}. Transactional
          booking messages may still be sent when required.
        </p>
      ) : (
        <p className="mt-4 max-w-xl text-[var(--travel-color-ink-soft)]">
          This unsubscribe link is invalid or has already been used.
        </p>
      )}
    </div>
  );
}
