import type { UserId } from './user.js';

export type ConsentPurpose =
  | 'transactional_email'
  | 'marketing_email'
  | 'marketing_whatsapp'
  | 'marketing_telegram'
  | 'marketing_sms';

export type ConsentChannel = 'email' | 'whatsapp' | 'telegram' | 'sms' | 'web';

export type ConsentSource =
  'registration' | 'preferences_ui' | 'checkout' | 'unsubscribe_link' | 'admin' | 'import';

export interface ConsentEvent {
  readonly id: string;
  readonly userId: UserId;
  readonly purpose: ConsentPurpose;
  readonly channel: ConsentChannel;
  readonly granted: boolean;
  readonly source: ConsentSource;
  readonly policyVersion: string;
  readonly evidence: string;
  readonly recordedAt: string;
  readonly withdrawnAt: string | null;
}

export interface ConsentStatus {
  readonly purpose: ConsentPurpose;
  readonly channel: ConsentChannel;
  readonly granted: boolean;
  readonly policyVersion: string;
  readonly updatedAt: string;
}

export const CURRENT_CONSENT_POLICY_VERSION = '2026-08-16.1';

export const MARKETING_PURPOSES: readonly ConsentPurpose[] = [
  'marketing_email',
  'marketing_whatsapp',
  'marketing_telegram',
  'marketing_sms',
] as const;

export function isMarketingPurpose(purpose: ConsentPurpose): boolean {
  return MARKETING_PURPOSES.includes(purpose);
}

/**
 * Transactional messaging is always permitted for account/booking operations.
 * It is recorded for audit but cannot be withdrawn into a blocking state for
 * legally required notices — withdrawal is ignored for enforcement.
 */
export function canSendForPurpose(
  statuses: readonly ConsentStatus[],
  purpose: ConsentPurpose,
): boolean {
  if (purpose === 'transactional_email') {
    return true;
  }
  const status = statuses.find((item) => item.purpose === purpose);
  return Boolean(status?.granted);
}

export function materializeConsentStatuses(events: readonly ConsentEvent[]): ConsentStatus[] {
  const latest = new Map<ConsentPurpose, ConsentEvent>();
  for (const event of events) {
    const existing = latest.get(event.purpose);
    if (!existing || Date.parse(event.recordedAt) >= Date.parse(existing.recordedAt)) {
      latest.set(event.purpose, event);
    }
  }

  return [...latest.values()].map((event) => ({
    purpose: event.purpose,
    channel: event.channel,
    granted: event.withdrawnAt ? false : event.granted,
    policyVersion: event.policyVersion,
    updatedAt: event.withdrawnAt ?? event.recordedAt,
  }));
}

export function createConsentEvent(input: {
  id?: string;
  userId: UserId;
  purpose: ConsentPurpose;
  channel: ConsentChannel;
  granted: boolean;
  source: ConsentSource;
  policyVersion?: string;
  evidence: string;
  now?: Date;
}): ConsentEvent {
  const recordedAt = (input.now ?? new Date()).toISOString();
  return {
    id: input.id ?? cryptoRandomId(),
    userId: input.userId,
    purpose: input.purpose,
    channel: input.channel,
    granted: input.granted,
    source: input.source,
    policyVersion: input.policyVersion ?? CURRENT_CONSENT_POLICY_VERSION,
    evidence: input.evidence.trim(),
    recordedAt,
    withdrawnAt: input.granted ? null : recordedAt,
  };
}

function cryptoRandomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `consent_${Math.random().toString(36).slice(2, 10)}`;
}
