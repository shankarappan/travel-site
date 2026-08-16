import { addItineraryItemInputSchema } from '@travel/api-contracts';
import { NextResponse } from 'next/server';
import { requireUserId, serializeTrip, tripErrorResponse } from '../../../../../server/trips/http';
import { addItemForUser } from '../../../../../server/trips/store';

type RouteContext = { params: Promise<{ tripId: string }> };

export async function POST(request: Request, context: RouteContext) {
  const authResult = await requireUserId();
  if ('response' in authResult) return authResult.response;
  const { tripId } = await context.params;
  const parsed = addItineraryItemInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid itinerary item' }, { status: 400 });
  }
  try {
    const trip = addItemForUser(tripId, authResult.userId, parsed.data);
    return NextResponse.json({ trip: serializeTrip(trip) }, { status: 201 });
  } catch (error) {
    return tripErrorResponse(error);
  }
}
