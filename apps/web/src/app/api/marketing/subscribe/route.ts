import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '../../../../server/identity/auth';
import { draftCampaignCopy, subscribeNewsletter } from '../../../../server/marketing/service';

const subscribeSchema = z.object({
  email: z.string().email(),
  campaign: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const parsed = subscribeSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }
  const result = subscribeNewsletter({
    userId: session.user.id,
    email: parsed.data.email,
    campaign: parsed.data.campaign,
  });
  if (!result.ok) {
    return NextResponse.json({ error: result.reason }, { status: 403 });
  }
  return NextResponse.json({
    ok: true,
    draftExample: draftCampaignCopy('South Island shoulder season'),
  });
}
