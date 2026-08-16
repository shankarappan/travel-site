import { NextResponse } from 'next/server';
import { z } from 'zod';
import { handleTelegramInbound } from '../../../../server/channels/adapters';

const schema = z.object({
  message: z.object({
    chat: z.object({ id: z.union([z.string(), z.number()]) }),
    text: z.string().min(1),
  }),
});

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid Telegram update' }, { status: 400 });
  }
  const result = await handleTelegramInbound({
    chatId: String(parsed.data.message.chat.id),
    body: parsed.data.message.text,
  });
  return NextResponse.json(result);
}
