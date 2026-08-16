import { NextResponse } from 'next/server';
import { z } from 'zod';
import {
  handleWhatsAppInbound,
  verifyWhatsAppSignature,
} from '../../../../server/channels/adapters';

const schema = z.object({
  from: z.string().min(3),
  body: z.string().min(1),
  isPromotional: z.boolean().optional(),
  hasMarketingConsent: z.boolean().optional(),
});

export async function POST(request: Request) {
  const raw = await request.text();
  const signature = request.headers.get('x-hub-signature-256') ?? '';
  const secret = process.env.WHATSAPP_APP_SECRET ?? 'dev-whatsapp-secret';
  if (!verifyWhatsAppSignature(raw, signature, secret) && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  const parsed = schema.safeParse(JSON.parse(raw));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
  try {
    const result = await handleWhatsAppInbound(parsed.data);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'WhatsApp handling failed' },
      { status: 400 },
    );
  }
}
