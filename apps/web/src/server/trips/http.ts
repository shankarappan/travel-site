import { TripNotFoundError, TripOwnershipError } from '@travel/domain';
import { NextResponse } from 'next/server';
import { auth } from '../identity/auth';

export async function requireUserId(): Promise<{ userId: string } | { response: NextResponse }> {
  const session = await auth();
  if (!session?.user?.id) {
    return { response: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }
  return { userId: session.user.id };
}

export function tripErrorResponse(error: unknown): NextResponse {
  if (error instanceof TripOwnershipError) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (error instanceof TripNotFoundError) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
}

export function serializeTrip(trip: {
  id: string;
  ownerId: { value: string };
  title: string;
  days: readonly unknown[];
  createdAt: string;
  updatedAt: string;
}) {
  return {
    id: trip.id,
    ownerId: trip.ownerId.value,
    title: trip.title,
    days: trip.days,
    createdAt: trip.createdAt,
    updatedAt: trip.updatedAt,
  };
}
