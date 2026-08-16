import type { DbPool } from '../pool.js';
import type {
  ConversationChannel,
  ConversationMessageRecord,
  ConversationRecord,
  ConversationRepository,
} from './types.js';

type ConversationRow = {
  id: string;
  user_id: string | null;
  created_at: Date;
  updated_at: Date;
};

type ChannelRow = {
  channel: ConversationChannel;
  external_id: string;
  linked_user_id: string | null;
  verified: boolean;
};

type MessageRow = {
  id: string;
  role: string;
  direction: 'inbound' | 'outbound' | null;
  body: string;
  tool_name: string | null;
  created_at: Date;
};

export class PostgresConversationRepository implements ConversationRepository {
  constructor(private readonly pool: DbPool) {}

  private async load(id: string): Promise<ConversationRecord | null> {
    const conversation = await this.pool.query<ConversationRow>(
      `SELECT * FROM conversations WHERE id = $1`,
      [id],
    );
    const row = conversation.rows[0];
    if (!row) return null;

    const channel = await this.pool.query<ChannelRow>(
      `SELECT channel, external_id, linked_user_id, verified
       FROM conversation_channels WHERE conversation_id = $1
       ORDER BY external_id LIMIT 1`,
      [id],
    );
    const messages = await this.pool.query<MessageRow>(
      `SELECT id, role, direction, body, tool_name, created_at
       FROM conversation_messages WHERE conversation_id = $1 ORDER BY created_at`,
      [id],
    );
    const channelRow = channel.rows[0];
    return {
      id: row.id,
      userId: row.user_id,
      channel: channelRow?.channel ?? null,
      channelExternalId: channelRow?.external_id ?? null,
      linkedUserId: channelRow?.linked_user_id ?? null,
      verified: channelRow?.verified ?? false,
      messages: messages.rows.map(
        (message): ConversationMessageRecord => ({
          id: message.id,
          role: message.role,
          direction: message.direction,
          body: message.body,
          toolName: message.tool_name,
          createdAt: message.created_at.toISOString(),
        }),
      ),
      createdAt: row.created_at.toISOString(),
      updatedAt: row.updated_at.toISOString(),
    };
  }

  async create(input: {
    id?: string;
    userId?: string | null;
    channel?: ConversationChannel;
    externalId?: string;
  }): Promise<ConversationRecord> {
    const id = input.id ?? `thread_${crypto.randomUUID()}`;
    const now = new Date().toISOString();
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `INSERT INTO conversations (id, user_id, created_at, updated_at)
         VALUES ($1,$2,$3::timestamptz,$3::timestamptz)`,
        [id, input.userId ?? null, now],
      );
      if (input.channel && input.externalId) {
        await client.query(
          `
          INSERT INTO conversation_channels (
            id, conversation_id, channel, external_id, linked_user_id, verified
          ) VALUES ($1,$2,$3,$4,$5,false)
          `,
          [crypto.randomUUID(), id, input.channel, input.externalId, input.userId ?? null],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return (await this.load(id))!;
  }

  async get(id: string): Promise<ConversationRecord | null> {
    return this.load(id);
  }

  async findByChannel(
    channel: ConversationChannel,
    externalId: string,
  ): Promise<ConversationRecord | null> {
    const result = await this.pool.query<{ conversation_id: string }>(
      `SELECT conversation_id FROM conversation_channels WHERE channel = $1 AND external_id = $2`,
      [channel, externalId],
    );
    const id = result.rows[0]?.conversation_id;
    if (!id) return null;
    return this.load(id);
  }

  async appendMessage(
    conversationId: string,
    message: Omit<ConversationMessageRecord, 'id' | 'createdAt'> & {
      id?: string;
      createdAt?: string;
    },
  ): Promise<ConversationRecord> {
    const id = message.id ?? crypto.randomUUID();
    const createdAt = message.createdAt ?? new Date().toISOString();
    await this.pool.query(
      `
      INSERT INTO conversation_messages (
        id, conversation_id, role, direction, body, tool_name, created_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz)
      `,
      [
        id,
        conversationId,
        message.role,
        message.direction,
        message.body,
        message.toolName ?? null,
        createdAt,
      ],
    );
    await this.pool.query(`UPDATE conversations SET updated_at = now() WHERE id = $1`, [
      conversationId,
    ]);
    return (await this.load(conversationId))!;
  }

  async issueAccountLinkCode(userId: string): Promise<string> {
    const code = Math.random().toString(36).slice(2, 8).toUpperCase();
    await this.pool.query(
      `INSERT INTO conversation_link_codes (code, user_id, expires_at)
       VALUES ($1,$2, now() + interval '15 minutes')`,
      [code, userId],
    );
    return code;
  }

  async verifyAccountLink(conversationId: string, code: string): Promise<ConversationRecord> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ user_id: string; expires_at: Date }>(
        `SELECT user_id, expires_at FROM conversation_link_codes WHERE code = $1 FOR UPDATE`,
        [code],
      );
      const row = result.rows[0];
      if (!row || row.expires_at.getTime() < Date.now()) {
        throw new Error('Invalid or expired link code');
      }
      await client.query(`DELETE FROM conversation_link_codes WHERE code = $1`, [code]);
      await client.query(
        `
        UPDATE conversation_channels
        SET linked_user_id = $2, verified = true
        WHERE conversation_id = $1
        `,
        [conversationId, row.user_id],
      );
      await client.query(
        `UPDATE conversations SET user_id = $2, updated_at = now() WHERE id = $1`,
        [conversationId, row.user_id],
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    const conversation = await this.load(conversationId);
    if (!conversation) throw new Error('Thread not found');
    return conversation;
  }

  async list(): Promise<ConversationRecord[]> {
    const result = await this.pool.query<{ id: string }>(
      `SELECT id FROM conversations ORDER BY created_at`,
    );
    const out: ConversationRecord[] = [];
    for (const row of result.rows) {
      const conversation = await this.load(row.id);
      if (conversation) out.push(conversation);
    }
    return out;
  }
}
