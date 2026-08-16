import { createLogger } from '@travel/observability';

const logger = createLogger({ service: 'web-email' });

export type SendEmailInput = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

export type SendEmailResult =
  | { ok: true; provider: 'resend'; providerMessageId: string }
  | { ok: false; reason: 'unconfigured' | 'provider_error'; message: string };

export function isEmailDeliveryConfigured(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(env.RESEND_API_KEY?.trim() && env.EMAIL_FROM?.trim());
}

/**
 * Transactional email via Resend HTTPS API.
 * Requires RESEND_API_KEY + EMAIL_FROM (e.g. "Aotearoa Trails <bookings@yourdomain.com>").
 */
export async function sendTransactionalEmail(
  input: SendEmailInput,
  env: Record<string, string | undefined> = process.env,
  fetchImpl: typeof fetch = fetch,
): Promise<SendEmailResult> {
  const apiKey = env.RESEND_API_KEY?.trim();
  const from = env.EMAIL_FROM?.trim();
  if (!apiKey || !from) {
    return {
      ok: false,
      reason: 'unconfigured',
      message: 'RESEND_API_KEY and EMAIL_FROM are required for email delivery',
    };
  }

  try {
    const response = await fetchImpl('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [input.to],
        subject: input.subject,
        text: input.text,
        html: input.html,
      }),
    });

    const payload = (await response.json().catch(() => null)) as {
      id?: string;
      message?: string;
      name?: string;
    } | null;

    if (!response.ok) {
      logger.error('email.provider_error', {
        status: response.status,
        provider: 'resend',
        message: payload?.message ?? payload?.name ?? 'unknown',
      });
      return {
        ok: false,
        reason: 'provider_error',
        message: payload?.message ?? `Resend HTTP ${response.status}`,
      };
    }

    return {
      ok: true,
      provider: 'resend',
      providerMessageId: payload?.id ?? 'unknown',
    };
  } catch (error) {
    logger.error('email.network_error', {
      message: error instanceof Error ? error.message : 'unknown',
    });
    return {
      ok: false,
      reason: 'provider_error',
      message: error instanceof Error ? error.message : 'network error',
    };
  }
}

export async function sendMagicLinkEmail(input: {
  to: string;
  verifyUrl: string;
}): Promise<SendEmailResult> {
  const subject = 'Your Aotearoa Trails sign-in link';
  const text = [
    'Sign in to Aotearoa Trails with this one-time link:',
    input.verifyUrl,
    '',
    'This link expires in 20 minutes and can only be used once.',
    'If you did not request it, you can ignore this email.',
  ].join('\n');
  const html = `
    <p>Sign in to <strong>Aotearoa Trails</strong> with this one-time link:</p>
    <p><a href="${input.verifyUrl}">Continue to Aotearoa Trails</a></p>
    <p style="color:#4a5754;font-size:14px">This link expires in 20 minutes and can only be used once. If you did not request it, you can ignore this email.</p>
  `.trim();

  return sendTransactionalEmail({
    to: input.to,
    subject,
    text,
    html,
  });
}
