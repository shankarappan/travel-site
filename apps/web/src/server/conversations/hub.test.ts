import { beforeEach, describe, expect, it } from 'vitest';
import {
  appendMessage,
  assertPrivateDataAccess,
  createThread,
  issueAccountLinkCode,
  resetConversationHub,
  verifyAccountLink,
} from './hub';

describe('conversation hub', () => {
  beforeEach(() => {
    resetConversationHub();
  });

  it('blocks private data until channel identity is verified', () => {
    const thread = createThread({ channel: 'whatsapp', externalId: '+6421000000' });
    appendMessage(thread.id, { direction: 'inbound', body: 'Where is my booking?' });
    expect(() => assertPrivateDataAccess(thread)).toThrow(/not linked/i);

    const code = issueAccountLinkCode('user_42');
    const linked = verifyAccountLink(thread.id, code);
    expect(linked.channelIdentity.verified).toBe(true);
    expect(() => assertPrivateDataAccess(linked)).not.toThrow();
  });
});
