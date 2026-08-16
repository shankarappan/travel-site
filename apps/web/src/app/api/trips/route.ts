import { createTripInputSchema } from '@travel/api-contracts';
import { NextResponse } from 'next/server';
import { requireUserId, serializeTrip, tripErrorResponse } from '../../../server/trips/http';
import { createTripForUser, listTripsForUser } from '../../../server/trips/store';

export async function GET() {
  const authResult = await requireUserId();
  if ('response' in authResult) return authResult.response;
  const trips = (await listTripsForUser(authResult.userId)).map(serializeTrip);
  return NextResponse.json({ trips });
}

export async function POST(request: Request) {
  const authResult = await requireUserId();
  if ('response' in authResult) return authResult.response;

  const parsed = createTripInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid title required' }, { status: 400 });
  }

  try {
    const trip = await createTripForUser(authResult.userId, parsed.data.title);
    return NextResponse.json({ trip: serializeTrip(trip) }, { status: 201 });
  } catch (error) {
    return tripErrorResponse(error);
  }
}
