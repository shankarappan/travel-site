import { createLogger } from '@travel/observability';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { issueMagicLinkToken } from '../../../../server/identity/store';

const logger = createLogger({ service: 'web-auth' });

const bodySchema = z.object({
  email: z.string().email().max(320),
});

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const token = issueMagicLinkToken(parsed.data.email);
  const verifyUrl = new URL('/api/auth/verify-magic-link', request.url);
  verifyUrl.searchParams.set('token', token);

  logger.info('passwordless sign-in link issued', { email: parsed.data.email });
  if (process.env.NODE_ENV !== 'production') {
    console.info(`\n[auth] Magic link for ${parsed.data.email}:\n${verifyUrl.toString()}\n`);
  }

  return NextResponse.json({
    ok: true,
    ...(process.env.NODE_ENV !== 'production' ? { devMagicLink: verifyUrl.toString() } : {}),
    message: 'If this email can receive mail, a sign-in link will arrive shortly.',
  });
}
