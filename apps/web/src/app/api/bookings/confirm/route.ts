import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '../../../../server/identity/auth';
import { confirmProviderBooking } from '../../../../server/commerce/store';

const schema = z.object({
  orderId: z.string().min(1),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'orderId required' }, { status: 400 });
  }
  try {
    const order = await confirmProviderBooking(parsed.data.orderId, session.user.id);
    return NextResponse.json({ order });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Booking failed' },
      { status: 400 },
    );
  }
}
