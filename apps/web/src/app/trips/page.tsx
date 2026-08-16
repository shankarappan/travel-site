import { EmptyState } from '@travel/ui';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { CreateTripForm } from '../../components/trips/create-trip-form';
import { auth } from '../../server/identity/auth';
import { listTripsForUser } from '../../server/trips/store';

export const metadata: Metadata = {
  title: 'Trips',
};

export default async function TripsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const trips = await listTripsForUser(session.user.id);

  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="travel-h1 text-[var(--travel-color-ink)]">Your trips</h1>
      <p className="mt-2 mb-8 max-w-2xl text-[var(--travel-color-ink-soft)]">
        Gather days, notes and ideas in one calm itinerary — ready whenever inspiration turns into
        plans.
      </p>

      <CreateTripForm />

      <div className="mt-10">
        {trips.length === 0 ? (
          <EmptyState
            title="No trips yet"
            description="Create a trip to collect days and itinerary items in one place."
          />
        ) : (
          <ul className="space-y-3">
            {trips.map((trip) => (
              <li key={trip.id}>
                <Link
                  href={`/trips/${trip.id}`}
                  className="block rounded-[var(--travel-radius-lg)] bg-[var(--travel-color-surface-elevated)] px-5 py-4 no-underline shadow-[var(--travel-elevation-1)] transition-[transform,box-shadow] hover:-translate-y-0.5 hover:shadow-[var(--travel-elevation-2)]"
                >
                  <span className="font-semibold text-[var(--travel-color-ink)]">{trip.title}</span>
                  <span className="mt-1 block text-sm text-[var(--travel-color-ink-soft)]">
                    Updated {new Date(trip.updatedAt).toLocaleString('en-NZ')}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
