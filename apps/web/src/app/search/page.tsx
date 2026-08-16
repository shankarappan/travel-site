import { SearchEntry } from '@travel/ui';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Search stays',
};

export default function SearchPage() {
  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)]">
        Search stays
      </h1>
      <p className="mt-2 max-w-2xl text-[var(--travel-color-ink-soft)]">
        Provider-backed results come later. This entry preserves the mobile-first search pattern.
      </p>
      <div className="mt-6 travel-animate-fade-up">
        <SearchEntry />
      </div>
    </div>
  );
}
