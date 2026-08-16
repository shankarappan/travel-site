import type { ConversationChannel, ConversationRecord } from '@travel/db';
import { conversationRepository } from '../persistence/repos';

export type { ConversationChannel };

export async function createThread(input: {
  channel: ConversationChannel;
  externalId: string;
}): Promise<ConversationRecord> {
  return conversationRepository().create({
    channel: input.channel,
    externalId: input.externalId,
  });
}

export async function appendMessage(
  threadId: string,
  message: { direction: 'inbound' | 'outbound'; body: string; role?: string },
): Promise<ConversationRecord> {
  return conversationRepository().appendMessage(threadId, {
    role: message.role ?? message.direction,
    direction: message.direction,
    body: message.body,
  });
}

export async function issueAccountLinkCode(userId: string): Promise<string> {
  return conversationRepository().issueAccountLinkCode(userId);
}

export async function verifyAccountLink(threadId: string, code: string): Promise<ConversationRecord> {
  return conversationRepository().verifyAccountLink(threadId, code);
}

export function assertPrivateDataAccess(thread: ConversationRecord): void {
  if (!thread.verified || !thread.linkedUserId) {
    throw new Error('Channel identity is not linked; private booking data is blocked');
  }
}

export async function listThreads(): Promise<ConversationRecord[]> {
  return conversationRepository().list();
}

export async function getThread(threadId: string): Promise<ConversationRecord | undefined> {
  return (await conversationRepository().get(threadId)) ?? undefined;
}

export async function findThreadByChannel(
  channel: ConversationChannel,
  externalId: string,
): Promise<ConversationRecord | null> {
  return conversationRepository().findByChannel(channel, externalId);
}
