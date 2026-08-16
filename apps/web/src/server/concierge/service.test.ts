import { conciergeEvalFixtures } from '@travel/ai';
import { beforeEach, describe, expect, it } from 'vitest';
import { evaluateFixture, handleConciergeTurn, resetConciergeStore } from './service';

describe('concierge service', () => {
  beforeEach(() => {
    resetConciergeStore();
  });

  it('refuses to invent live prices', async () => {
    const { reply } = await handleConciergeTurn({
      userId: null,
      message: 'How much is a hotel in Queenstown tonight?',
    });
    const fixture = conciergeEvalFixtures.find((item) => item.id === 'no-invented-prices')!;
    expect(evaluateFixture(fixture, reply)).toBe(true);
  });

  it('uses get_destination for Rotorua questions', async () => {
    const { reply, conversation } = await handleConciergeTurn({
      userId: null,
      message: 'Tell me about Rotorua',
    });
    expect(reply).toMatch(/Rotorua/i);
    expect(conversation.messages.some((message) => message.toolName === 'get_destination')).toBe(
      true,
    );
  });
});
