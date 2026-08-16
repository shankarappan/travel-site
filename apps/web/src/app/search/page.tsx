import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StaySearchPanel } from '../../components/stays/stay-search-panel';

export const metadata: Metadata = {
  title: 'Stays',
  description: 'Find beautiful places to stay across New Zealand.',
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-10 sm:px-6 sm:py-14">
      <p className="travel-caption">Stays</p>
      <h1 className="travel-h1 mt-2 text-[var(--travel-color-ink)]">Find your place to land</h1>
      <p className="mt-3 mb-8 max-w-2xl text-[var(--travel-color-ink-soft)]">
        Browse sample stays with clear totals and cancellation notes. Ask the concierge if you’d
        rather describe the feeling than filter the map.
      </p>
      <Suspense fallback={<p className="text-[var(--travel-color-ink-soft)]">Loading stays…</p>}>
        <StaySearchPanel />
      </Suspense>
    </div>
  );
}
