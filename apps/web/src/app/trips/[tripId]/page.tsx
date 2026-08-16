import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { TripEditor } from '../../../components/trips/trip-editor';
import { auth } from '../../../server/identity/auth';
import { getTripForUser } from '../../../server/trips/store';
import { TripNotFoundError, TripOwnershipError } from '@travel/domain';

type PageProps = { params: Promise<{ tripId: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const session = await auth();
  if (!session?.user?.id) {
    return { title: 'Trip' };
  }
  const { tripId } = await params;
  try {
    const trip = getTripForUser(tripId, session.user.id);
    return { title: trip.title };
  } catch {
    return { title: 'Trip' };
  }
}

export default async function TripDetailPage({ params }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect('/sign-in');
  }

  const { tripId } = await params;
  try {
    const trip = getTripForUser(tripId, session.user.id);
    return (
      <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-8 sm:px-6 sm:py-12">
        <p className="mb-4 text-sm">
          <a
            href="/trips"
            className="font-semibold text-[var(--travel-color-fern)] underline-offset-2 hover:underline"
          >
            All trips
          </a>
        </p>
        <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)]">
          {trip.title}
        </h1>
        <div className="mt-8">
          <TripEditor
            initialTrip={{
              id: trip.id,
              title: trip.title,
              updatedAt: trip.updatedAt,
              days: trip.days.map((day) => ({
                id: day.id,
                label: day.label,
                sortOrder: day.sortOrder,
                items: day.items.map((item) => ({ ...item })),
              })),
            }}
          />
        </div>
      </div>
    );
  } catch (error) {
    if (error instanceof TripOwnershipError || error instanceof TripNotFoundError) {
      notFound();
    }
    throw error;
  }
}
