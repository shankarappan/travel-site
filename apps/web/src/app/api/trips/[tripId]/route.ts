import { renameTripInputSchema } from '@travel/api-contracts';
import { NextResponse } from 'next/server';
import { requireUserId, serializeTrip, tripErrorResponse } from '../../../../server/trips/http';
import {
  deleteTripForUser,
  getTripForUser,
  renameTripForUser,
} from '../../../../server/trips/store';

type RouteContext = { params: Promise<{ tripId: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const authResult = await requireUserId();
  if ('response' in authResult) return authResult.response;
  const { tripId } = await context.params;
  try {
    const trip = getTripForUser(tripId, authResult.userId);
    return NextResponse.json({ trip: serializeTrip(trip) });
  } catch (error) {
    return tripErrorResponse(error);
  }
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await requireUserId();
  if ('response' in authResult) return authResult.response;
  const { tripId } = await context.params;
  const parsed = renameTripInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid title required' }, { status: 400 });
  }
  try {
    const trip = renameTripForUser(tripId, authResult.userId, parsed.data.title);
    return NextResponse.json({ trip: serializeTrip(trip) });
  } catch (error) {
    return tripErrorResponse(error);
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const authResult = await requireUserId();
  if ('response' in authResult) return authResult.response;
  const { tripId } = await context.params;
  try {
    deleteTripForUser(tripId, authResult.userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return tripErrorResponse(error);
  }
}
