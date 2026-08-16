import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handlePaymentWebhook } from '../../../../server/commerce/store';

const schema = z.object({
  eventId: z.string().min(1),
  providerRef: z.string().min(1),
  status: z.enum(['requires_payment', 'processing', 'succeeded', 'failed', 'refunded']),
});

export async function POST(request: Request) {
  const signature = request.headers.get('x-travel-webhook-signature') ?? '';
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid webhook' }, { status: 400 });
  }
  try {
    const result = handlePaymentWebhook({
      ...parsed.data,
      signature,
    });
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Webhook failed' },
      { status: 400 },
    );
  }
}
