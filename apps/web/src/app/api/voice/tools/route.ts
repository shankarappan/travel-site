import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleVoiceTool } from '../../../../server/channels/adapters';

const schema = z.object({
  tool: z.enum([
    'identify_customer',
    'get_booking_summary',
    'get_itinerary',
    'create_support_case',
    'transfer_human',
  ]),
  values: z.record(z.string()),
  confirmedReadback: z.boolean().default(false),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid voice tool payload' }, { status: 400 });
  }
  const result = handleVoiceTool(parsed.data);
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
