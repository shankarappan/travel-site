import { consentLedger } from '@travel/consent';
import { createLogger } from '@travel/observability';
import { queueEmail } from '../commerce/store';

const logger = createLogger({ service: 'marketing' });

export function subscribeNewsletter(input: {
  userId: string;
  email: string;
  campaign?: string;
}): { ok: true } | { ok: false; reason: string } {
  consentLedger.ensureTransactional(input.userId);
  const statuses = consentLedger.getStatuses(input.userId);
  const marketing = statuses.find((status) => status.purpose === 'marketing_email');
  if (!marketing?.granted) {
    return { ok: false, reason: 'Marketing email consent required' };
  }
  queueEmail({
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
