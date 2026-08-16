export type ConversationChannel = 'web' | 'whatsapp' | 'telegram' | 'voice';

export interface ChannelIdentity {
  channel: ConversationChannel;
  externalId: string;
  linkedUserId: string | null;
  verified: boolean;
}

export interface ConversationThread {
  id: string;
  channel: ConversationChannel;
  channelIdentity: ChannelIdentity;
  messages: Array<{
    id: string;
    direction: 'inbound' | 'outbound';
    body: string;
    createdAt: string;
  }>;
  toolActions: Array<{
    id: string;
    toolName: string;
    resultSummary: string;
    createdAt: string;
  }>;
  createdAt: string;
}

const threads = new Map<string, ConversationThread>();
const linkCodes = new Map<string, { userId: string; expiresAt: number }>();

export function resetConversationHub(): void {
  threads.clear();
  linkCodes.clear();
}

export function createThread(input: {
  channel: ConversationChannel;
  externalId: string;
}): ConversationThread {
  const thread: ConversationThread = {
    id: `thread_${crypto.randomUUID()}`,
    channel: input.channel,
    channelIdentity: {
      channel: input.channel,
      externalId: input.externalId,
      linkedUserId: null,
      verified: false,
    },
    messages: [],
    toolActions: [],
    createdAt: new Date().toISOString(),
  };
  threads.set(thread.id, thread);
  return thread;
}

export function appendMessage(
  threadId: string,
  message: { direction: 'inbound' | 'outbound'; body: string },
): ConversationThread {
  const thread = threads.get(threadId);
  if (!thread) throw new Error('Thread not found');
  thread.messages.push({
    id: crypto.randomUUID(),
    direction: message.direction,
    body: message.body,
    createdAt: new Date().toISOString(),
  });
  return thread;
}

export function issueAccountLinkCode(userId: string): string {
  const code = Math.random().toString(36).slice(2, 8).toUpperCase();
  linkCodes.set(code, { userId, expiresAt: Date.now() + 15 * 60 * 1000 });
  return code;
}

export function verifyAccountLink(threadId: string, code: string): ConversationThread {
  const thread = threads.get(threadId);
  if (!thread) throw new Error('Thread not found');
  const record = linkCodes.get(code);
  if (!record || record.expiresAt < Date.now()) {
    throw new Error('Invalid or expired link code');
  }
  linkCodes.delete(code);
  thread.channelIdentity = {
    ...thread.channelIdentity,
    linkedUserId: record.userId,
    verified: true,
  };
  return thread;
}

export function assertPrivateDataAccess(thread: ConversationThread): void {
  if (!thread.channelIdentity.verified || !thread.channelIdentity.linkedUserId) {
    throw new Error('Channel identity is not linked; private booking data is blocked');
  }
}

export function listThreads(): ConversationThread[] {
  return [...threads.values()];
}

export function getThread(threadId: string): ConversationThread | undefined {
  return threads.get(threadId);
}
