import { consentLedger } from '@travel/consent';

export { consentLedger as default, consentLedger };

export function resetConsentStore(): void {
  consentLedger.reset();
}

export function listConsentEvents(userId: string) {
  return consentLedger.listEvents(userId);
}

export function getConsentStatuses(userId: string) {
  return consentLedger.getStatuses(userId);
}

export function recordConsent(input: Parameters<typeof consentLedger.record>[0]) {
  return consentLedger.record(input);
}

export function ensureTransactionalConsent(userId: string): void {
  consentLedger.ensureTransactional(userId);
}

export function issueUnsubscribeToken(
  userId: string,
  purpose: Parameters<typeof consentLedger.issueUnsubscribeToken>[1],
) {
  return consentLedger.issueUnsubscribeToken(userId, purpose);
}

export function withdrawByUnsubscribeToken(token: string) {
  return consentLedger.withdrawByUnsubscribeToken(token);
}

export function maySend(userId: string, purpose: Parameters<typeof consentLedger.maySend>[1]) {
  return consentLedger.maySend(userId, purpose);
}

export function listAllConsentLedgers() {
  return consentLedger.listAll();
}
