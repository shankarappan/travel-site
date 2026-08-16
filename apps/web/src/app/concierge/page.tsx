import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ConciergeChat } from '../../components/concierge/concierge-chat';

export const metadata: Metadata = {
  title: 'Travel concierge',
  description: 'A personal New Zealand travel concierge for ideas, itineraries and guidance.',
};

export default function ConciergePage() {
  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-10 sm:px-6 sm:py-14">
      <p className="travel-caption">Personal travel expert</p>
      <h1 className="travel-h1 mt-2 text-[var(--travel-color-ink)]">Your concierge</h1>
      <p className="mt-3 mb-10 max-w-2xl text-[var(--travel-color-ink-soft)]">
        Warm guidance for destinations and trip ideas. Browse stays anytime — use chat when you want
        a thinking partner.
      </p>
      <Suspense
        fallback={<p className="text-[var(--travel-color-ink-soft)]">Opening concierge…</p>}
      >
        <ConciergeChat />
      </Suspense>
    </div>
  );
}
