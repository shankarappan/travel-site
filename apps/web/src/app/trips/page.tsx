import { EmptyState } from '@travel/ui';
import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Trips',
};

export default function TripsPage() {
  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)]">
        Your trips
      </h1>
      <p className="mt-2 mb-6 max-w-2xl text-[var(--travel-color-ink-soft)]">
        Saved itineraries will live here once accounts and trip ownership land.
      </p>
      <EmptyState
        title="No trips yet"
        description="Create a trip to collect days, stays and activities in one place."
      >
        <Link
          href="/search"
          className="text-sm font-semibold text-[var(--travel-color-fern)] underline-offset-2 hover:underline"
        >
          Browse destinations
        </Link>
      </EmptyState>
    </div>
  );
}
