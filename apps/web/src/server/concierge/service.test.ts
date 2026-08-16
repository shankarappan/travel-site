import { conciergeEvalFixtures } from '@travel/ai';
import type {
  ConversationMessageRecord,
  ConversationRecord,
  ConversationRepository,
} from '@travel/db';
import { beforeEach, describe, expect, it } from 'vitest';
import { resetRepositorySingletons, setRepositoriesForTests } from '../persistence/repos';
import { evaluateFixture, handleConciergeTurn, resetConciergeStore } from './service';

class MemoryConversationRepository implements ConversationRepository {
  private readonly threads = new Map<string, ConversationRecord>();

  async create(input: {
    id?: string;
    userId?: string | null;
    channel?: ConversationRecord['channel'];
    externalId?: string;
  }): Promise<ConversationRecord> {
    const now = new Date().toISOString();
    const record: ConversationRecord = {
      id: input.id ?? `thread_${crypto.randomUUID()}`,
      userId: input.userId ?? null,
      channel: input.channel ?? null,
      channelExternalId: input.externalId ?? null,
      linkedUserId: null,
      verified: false,
      messages: [],
      createdAt: now,
      updatedAt: now,
    };
    this.threads.set(record.id, record);
    return structuredClone(record);
  }

  async get(id: string): Promise<ConversationRecord | null> {
    const record = this.threads.get(id);
    return record ? structuredClone(record) : null;
  }

  async findByChannel(
    channel: NonNullable<ConversationRecord['channel']>,
    externalId: string,
  ): Promise<ConversationRecord | null> {
    for (const record of this.threads.values()) {
      if (record.channel === channel && record.channelExternalId === externalId) {
        return structuredClone(record);
      }
    }
    return null;
  }

  async appendMessage(
    conversationId: string,
    message: Omit<ConversationMessageRecord, 'id' | 'createdAt'> & {
      id?: string;
      createdAt?: string;
    },
  ): Promise<ConversationRecord> {
    const record = this.threads.get(conversationId);
    if (!record) throw new Error('Thread not found');
    record.messages.push({
      id: message.id ?? crypto.randomUUID(),
      role: message.role,
      direction: message.direction,
      body: message.body,
      toolName: message.toolName ?? null,
      createdAt: message.createdAt ?? new Date().toISOString(),
    });
    record.updatedAt = new Date().toISOString();
    return structuredClone(record);
  }

  async issueAccountLinkCode(): Promise<string> {
    return 'CODE12';
  }

  async verifyAccountLink(): Promise<ConversationRecord> {
    throw new Error('unused in unit tests');
  }

  async list(): Promise<ConversationRecord[]> {
    return [...this.threads.values()].map((record) => structuredClone(record));
  }
}

describe('concierge service', () => {
  beforeEach(() => {
    resetConciergeStore();
    resetRepositorySingletons();
    setRepositoriesForTests({ conversations: new MemoryConversationRepository() });
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
