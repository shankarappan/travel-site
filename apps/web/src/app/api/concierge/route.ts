import { NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '../../../server/identity/auth';
import { handleConciergeTurn } from '../../../server/concierge/service';

const bodySchema = z.object({
  message: z.string().min(1).max(2000),
  conversationId: z.string().optional(),
});

export async function POST(request: Request) {
  const session = await auth();
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Message required' }, { status: 400 });
  }
  try {
    const result = await handleConciergeTurn({
      conversationId: parsed.data.conversationId,
      userId: session?.user?.id ?? null,
      message: parsed.data.message,
    });
    return NextResponse.json({
      conversationId: result.conversation.id,
      reply: result.reply,
      messages: result.conversation.messages,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Concierge error';
    const status = message.includes('Rate limit') ? 429 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
