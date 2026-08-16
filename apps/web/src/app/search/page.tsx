import type { Metadata } from 'next';
import { Suspense } from 'react';
import { StaySearchPanel } from '../../components/stays/stay-search-panel';

export const metadata: Metadata = {
  title: 'Search stays',
  description: 'Sandbox accommodation search with normalized provider offers.',
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)]">
        Search stays
      </h1>
      <p className="mt-2 mb-8 max-w-2xl text-[var(--travel-color-ink-soft)]">
        Results come from the fake sandbox provider. Totals include taxes/fees and show offer
        expiry.
      </p>
      <Suspense fallback={<p>Loading search…</p>}>
        <StaySearchPanel />
      </Suspense>
    </div>
  );
}
