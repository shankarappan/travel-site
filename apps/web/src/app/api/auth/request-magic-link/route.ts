import { createLogger } from '@travel/observability';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { isEmailDeliveryConfigured, sendMagicLinkEmail } from '../../../../server/email/send';
import {
  assertMagicLinkRateLimit,
  clientIpFromRequest,
} from '../../../../server/identity/rate-limit';
import { issueMagicLinkToken } from '../../../../server/identity/store';
import { buildAppUrl } from '../../../../server/identity/urls';

const logger = createLogger({ service: 'web-auth' });

const bodySchema = z.object({
  email: z.string().email().max(320),
});

const ANTI_ENUMERATION_MESSAGE =
  'If this email can receive mail, a sign-in link will arrive shortly.';

export async function POST(request: Request) {
  const json: unknown = await request.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Valid email required' }, { status: 400 });
  }

  const email = parsed.data.email;
  const requestIp = clientIpFromRequest(request);
  const rate = await assertMagicLinkRateLimit({ email, requestIp });
  if (!rate.ok) {
    return NextResponse.json(
      { error: 'Too many sign-in requests. Please try again later.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rate.retryAfterSeconds) },
      },
    );
  }

  const token = await issueMagicLinkToken({ email, requestIp });
  const verifyUrl = buildAppUrl('/api/auth/verify-magic-link', request.url, { token });

  const deliveryConfigured = isEmailDeliveryConfigured();
  let deliveryOk = false;

  if (deliveryConfigured) {
    const sent = await sendMagicLinkEmail({ to: email, verifyUrl: verifyUrl.toString() });
    deliveryOk = sent.ok;
    if (sent.ok) {
      logger.info('passwordless sign-in email queued', {
        email,
        provider: sent.provider,
        providerMessageId: sent.providerMessageId,
      });
    } else {
      logger.error('passwordless sign-in email failed', {
        email,
        reason: sent.reason,
        message: sent.message,
      });
    }
  } else {
    logger.error('passwordless sign-in email unconfigured', {
      email,
      hint: 'Set RESEND_API_KEY and EMAIL_FROM',
    });
  }

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    // Dev-only console aid — never log the raw token in production.
    console.info(`\n[auth] Dev magic link for ${email}:\n${verifyUrl.toString()}\n`);
  }

  return NextResponse.json({
    ok: true,
    message: ANTI_ENUMERATION_MESSAGE,
    ...(!isProd
      ? {
          devMagicLink: verifyUrl.toString(),
          emailDelivery: deliveryConfigured ? (deliveryOk ? 'sent' : 'failed') : 'skipped',
        }
      : {}),
  });
}
