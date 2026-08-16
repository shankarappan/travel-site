import type {
  ConsentChannel,
  ConsentEvent,
  ConsentPurpose,
  ConsentSource,
  ConsentStatus,
} from '@travel/domain';
import { consentRepository } from '../persistence/repos';

export async function ensureTransactionalConsent(userId: string): Promise<void> {
  await consentRepository().ensureTransactional(userId);
}

export async function recordConsent(input: {
  userId: string;
  purpose: ConsentPurpose;
  channel: ConsentChannel;
  granted: boolean;
  source: ConsentSource;
  evidence: string;
  policyVersion?: string;
}): Promise<ConsentEvent> {
  return consentRepository().record(input);
}

export async function getConsentStatuses(userId: string): Promise<ConsentStatus[]> {
  return consentRepository().getStatuses(userId);
}

export async function listConsentEvents(userId: string): Promise<ConsentEvent[]> {
  return consentRepository().listEvents(userId);
}

export async function issueUnsubscribeToken(
  userId: string,
  purpose: ConsentPurpose,
): Promise<string> {
  return consentRepository().issueUnsubscribeToken(userId, purpose);
}

export async function withdrawByUnsubscribeToken(token: string): Promise<ConsentEvent | null> {
  return consentRepository().withdrawByUnsubscribeToken(token);
}

export async function maySend(userId: string, purpose: ConsentPurpose): Promise<boolean> {
  return consentRepository().maySend(userId, purpose);
}
