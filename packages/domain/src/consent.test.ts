import { describe, expect, it } from 'vitest';
import {
  canSendForPurpose,
  createConsentEvent,
  createUserId,
  materializeConsentStatuses,
} from './index.js';

describe('consent ledger', () => {
  const userId = createUserId('user_1');

  it('keeps transactional email sendable even after a withdrawal event', () => {
    const events = [
      createConsentEvent({
        userId,
        purpose: 'transactional_email',
        channel: 'email',
        granted: true,
        source: 'registration',
        evidence: 'account created',
      }),
      createConsentEvent({
        userId,
        purpose: 'transactional_email',
        channel: 'email',
        granted: false,
        source: 'preferences_ui',
        evidence: 'user attempted withdrawal',
      }),
    ];
    const statuses = materializeConsentStatuses(events);
    expect(canSendForPurpose(statuses, 'transactional_email')).toBe(true);
  });

  it('requires grant for marketing email and respects withdrawal', () => {
    const granted = createConsentEvent({
      userId,
      purpose: 'marketing_email',
      channel: 'email',
      granted: true,
      source: 'preferences_ui',
      evidence: 'opt-in checkbox',
      now: new Date('2026-08-01T00:00:00.000Z'),
    });
    const withdrawn = createConsentEvent({
      userId,
      purpose: 'marketing_email',
      channel: 'email',
      granted: false,
      source: 'unsubscribe_link',
      evidence: 'one-click unsubscribe',
      now: new Date('2026-08-02T00:00:00.000Z'),
    });
    const statuses = materializeConsentStatuses([granted, withdrawn]);
    expect(canSendForPurpose(statuses, 'marketing_email')).toBe(false);
    expect(statuses[0]?.policyVersion).toBeTruthy();
  });
});
