import { createLogger } from '@travel/observability';
import { queueEmail } from '../commerce/store';
import { ensureTransactionalConsent, getConsentStatuses } from '../consent/store';

const logger = createLogger({ service: 'marketing' });

export async function subscribeNewsletter(input: {
  userId: string;
  email: string;
  campaign?: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  await ensureTransactionalConsent(input.userId);
  const statuses = await getConsentStatuses(input.userId);
  const marketing = statuses.find((status) => status.purpose === 'marketing_email');
  if (!marketing?.granted) {
    return { ok: false, reason: 'Marketing email consent required' };
  }
  await queueEmail({
    template: 'marketing.newsletter_welcome',
    version: '1.0.0',
    to: input.email,
  });
  logger.info('marketing.subscribed', {
    userId: input.userId,
    campaign: input.campaign ?? 'newsletter',
  });
  return { ok: true };
}

export function draftCampaignCopy(topic: string): {
  subject: string;
  body: string;
  requiresApproval: true;
} {
  return {
    subject: `Aotearoa ideas: ${topic}`,
    body: `Draft only — human approval required before publish. Topic: ${topic}`,
    requiresApproval: true,
  };
}
