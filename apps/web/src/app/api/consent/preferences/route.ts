import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '../../../../server/identity/auth';
import { ensureTransactionalConsent, recordConsent } from '../../../../server/consent/store';

const schema = z.object({
  preferences: z.record(z.boolean()),
});

const allowed = new Set([
  'marketing_email',
  'marketing_whatsapp',
  'marketing_telegram',
  'marketing_sms',
]);

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  ensureTransactionalConsent(session.user.id);

  for (const [purpose, granted] of Object.entries(parsed.data.preferences)) {
    if (!allowed.has(purpose)) continue;
    recordConsent({
      userId: session.user.id,
      purpose: purpose as
        'marketing_email' | 'marketing_whatsapp' | 'marketing_telegram' | 'marketing_sms',
      channel:
        purpose === 'marketing_whatsapp'
          ? 'whatsapp'
          : purpose === 'marketing_telegram'
            ? 'telegram'
            : purpose === 'marketing_sms'
              ? 'sms'
              : 'email',
      granted,
      source: 'preferences_ui',
      evidence: `preferences UI toggle ${purpose}=${granted}`,
    });
  }

  return NextResponse.json({ ok: true });
}
