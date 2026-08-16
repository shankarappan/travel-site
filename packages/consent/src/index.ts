import { createLogger } from '@travel/observability';
import {
  canSendForPurpose,
  createConsentEvent,
  createUserId,
  materializeConsentStatuses,
  type ConsentChannel,
  type ConsentEvent,
  type ConsentPurpose,
  type ConsentSource,
  type ConsentStatus,
} from '@travel/domain';

const logger = createLogger({ service: 'consent' });

export class InMemoryConsentLedger {
  private readonly eventsByUser = new Map<string, ConsentEvent[]>();
  private readonly unsubscribeTokens = new Map<
    string,
    { userId: string; purpose: ConsentPurpose }
  >();

  reset(): void {
    this.eventsByUser.clear();
    this.unsubscribeTokens.clear();
  }

  listEvents(userId: string): ConsentEvent[] {
    return [...(this.eventsByUser.get(userId) ?? [])].sort((a, b) =>
      a.recordedAt.localeCompare(b.recordedAt),
    );
  }

  getStatuses(userId: string): ConsentStatus[] {
    return materializeConsentStatuses(this.listEvents(userId));
  }

  record(input: {
    userId: string;
    purpose: ConsentPurpose;
    channel: ConsentChannel;
    granted: boolean;
    source: ConsentSource;
    evidence: string;
    policyVersion?: string;
  }): ConsentEvent {
    const event = createConsentEvent({
      userId: createUserId(input.userId),
      purpose: input.purpose,
      channel: input.channel,
      granted: input.granted,
      source: input.source,
      evidence: input.evidence,
      policyVersion: input.policyVersion,
    });
    const existing = this.eventsByUser.get(input.userId) ?? [];
    this.eventsByUser.set(input.userId, [...existing, event]);
    logger.info('consent.event_recorded', {
      userId: input.userId,
      purpose: input.purpose,
      granted: input.granted,
      source: input.source,
      policyVersion: event.policyVersion,
    });
    return event;
  }

  ensureTransactional(userId: string): void {
    if (this.getStatuses(userId).some((status) => status.purpose === 'transactional_email')) {
      return;
    }
    this.record({
      userId,
      purpose: 'transactional_email',
      channel: 'email',
      granted: true,
      source: 'registration',
      evidence: 'account registration implies transactional notices',
    });
  }

  issueUnsubscribeToken(userId: string, purpose: ConsentPurpose): string {
    const token = crypto.randomUUID();
    this.unsubscribeTokens.set(token, { userId, purpose });
    return token;
  }

  withdrawByUnsubscribeToken(token: string): ConsentEvent | null {
    const record = this.unsubscribeTokens.get(token);
    if (!record) return null;
    this.unsubscribeTokens.delete(token);
    return this.record({
      userId: record.userId,
      purpose: record.purpose,
      channel: purposeToChannel(record.purpose),
      granted: false,
      source: 'unsubscribe_link',
      evidence: `unsubscribe token ${token}`,
    });
  }

  maySend(userId: string, purpose: ConsentPurpose): boolean {
    return canSendForPurpose(this.getStatuses(userId), purpose);
  }

  listAll(): Array<{ userId: string; statuses: ConsentStatus[]; events: ConsentEvent[] }> {
    return [...this.eventsByUser.keys()].map((userId) => ({
      userId,
      statuses: this.getStatuses(userId),
      events: this.listEvents(userId),
    }));
  }
}

function purposeToChannel(purpose: ConsentPurpose): ConsentChannel {
  switch (purpose) {
    case 'marketing_whatsapp':
      return 'whatsapp';
    case 'marketing_telegram':
      return 'telegram';
    case 'marketing_sms':
      return 'sms';
    default:
      return 'email';
  }
}

/** Process-local ledger until Postgres-backed consent storage lands. */
export const consentLedger = new InMemoryConsentLedger();
