import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '../../../server/identity/auth';
import { createPaymentSession, createQuotedOrder } from '../../../server/commerce/store';

const schema = z.object({
  offerId: z.string().min(1),
  idempotencyKey: z.string().min(8),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid checkout payload' }, { status: 400 });
  }
  try {
    const { order, quoteId } = await createQuotedOrder({
      userId: session.user.id,
      offerId: parsed.data.offerId,
      idempotencyKey: parsed.data.idempotencyKey,
    });
    const payment = createPaymentSession(order);
    return NextResponse.json({
      order,
      quoteId,
      payment: {
        id: payment.id,
        providerRef: payment.providerRef,
        amountMinor: payment.amountMinor,
        currency: payment.currency,
        hostedCheckout: true,
        note: 'Sandbox tokenized checkout — no raw card data stored',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Checkout failed' },
      { status: 400 },
    );
  }
}
