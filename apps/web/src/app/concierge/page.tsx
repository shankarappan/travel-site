import type { Metadata } from 'next';
import { ConciergeChat } from '../../components/concierge/concierge-chat';

export const metadata: Metadata = {
  title: 'AI concierge',
  description: 'Read-only New Zealand travel concierge using curated content tools.',
};

export default function ConciergePage() {
  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)]">
        AI concierge
      </h1>
      <p className="mt-2 mb-8 max-w-2xl text-[var(--travel-color-ink-soft)]">
        Read-only tools over curated destinations and your saved trips. Live availability is not
        connected.
      </p>
      <ConciergeChat />
    </div>
  );
}
