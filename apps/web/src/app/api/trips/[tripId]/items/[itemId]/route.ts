import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  requireUserId,
  serializeTrip,
  tripErrorResponse,
} from '../../../../../../server/trips/http';
import { deleteItemForUser } from '../../../../../../server/trips/store';

type RouteContext = { params: Promise<{ tripId: string; itemId: string }> };

const querySchema = z.object({
  dayId: z.string().min(1),
});

export async function DELETE(request: Request, context: RouteContext) {
  const authResult = await requireUserId();
  if ('response' in authResult) return authResult.response;
  const { tripId, itemId } = await context.params;
  const dayId = new URL(request.url).searchParams.get('dayId');
  const parsed = querySchema.safeParse({ dayId });
  if (!parsed.success) {
    return NextResponse.json({ error: 'dayId query required' }, { status: 400 });
  }
  try {
    const trip = deleteItemForUser(tripId, authResult.userId, parsed.data.dayId, itemId);
    return NextResponse.json({ trip: serializeTrip(trip) });
  } catch (error) {
    return tripErrorResponse(error);
  }
}
