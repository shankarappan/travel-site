import { reorderItineraryItemsInputSchema } from '@travel/api-contracts';
import { NextResponse } from 'next/server';
import {
  requireUserId,
  serializeTrip,
  tripErrorResponse,
} from '../../../../../../server/trips/http';
import { reorderItemsForUser } from '../../../../../../server/trips/store';

type RouteContext = { params: Promise<{ tripId: string }> };

export async function PUT(request: Request, context: RouteContext) {
  const authResult = await requireUserId();
  if ('response' in authResult) return authResult.response;
  const { tripId } = await context.params;
  const parsed = reorderItineraryItemsInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid reorder payload' }, { status: 400 });
  }
  try {
    const trip = await reorderItemsForUser(
      tripId,
      authResult.userId,
      parsed.data.dayId,
      parsed.data.orderedItemIds,
    );
    return NextResponse.json({ trip: serializeTrip(trip) });
  } catch (error) {
    return tripErrorResponse(error);
  }
}
