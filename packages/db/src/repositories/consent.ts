import {
  canSendForPurpose,
  createConsentEvent,
  createUserId,
  materializeConsentStatuses,
  type ConsentChannel,
  type ConsentEvent,
  type ConsentPurpose,
  type ConsentSource,
  type ConsentStatus,
} from '@travel/domain';
import { createLogger } from '@travel/observability';
import type { DbPool } from '../pool.js';
import type { ConsentRepository } from './types.js';

const logger = createLogger({ service: 'consent-db' });

type ConsentRow = {
  id: string;
  user_id: string;
  purpose: ConsentPurpose;
  channel: ConsentChannel;
  granted: boolean;
  source: ConsentSource;
  policy_version: string;
  evidence: string;
  recorded_at: Date;
  withdrawn_at: Date | null;
};

function mapEvent(row: ConsentRow): ConsentEvent {
  return {
    id: row.id,
    userId: createUserId(row.user_id),
    purpose: row.purpose,
    channel: row.channel,
    granted: row.granted,
    source: row.source,
    policyVersion: row.policy_version,
    evidence: row.evidence,
    recordedAt: row.recorded_at.toISOString(),
    withdrawnAt: row.withdrawn_at ? row.withdrawn_at.toISOString() : null,
  };
}

function purposeToChannel(purpose: ConsentPurpose): ConsentChannel {
  switch (purpose) {
    case 'marketing_whatsapp':
      return 'whatsapp';
    case 'marketing_telegram':
      return 'telegram';
    case 'marketing_sms':
      return 'sms';
    default:
      return 'email';
  }
}

export class PostgresConsentRepository implements ConsentRepository {
  constructor(private readonly pool: DbPool) {}

  async listEvents(userId: string): Promise<ConsentEvent[]> {
    const result = await this.pool.query<ConsentRow>(
      `SELECT * FROM consent_events WHERE user_id = $1 ORDER BY recorded_at ASC`,
      [userId],
    );
    return result.rows.map(mapEvent);
  }

  async getStatuses(userId: string): Promise<ConsentStatus[]> {
    return materializeConsentStatuses(await this.listEvents(userId));
  }

  async record(input: {
    userId: string;
    purpose: ConsentPurpose;
    channel: ConsentChannel;
    granted: boolean;
    source: ConsentSource;
    evidence: string;
    policyVersion?: string;
  }): Promise<ConsentEvent> {
    const event = createConsentEvent({
      userId: createUserId(input.userId),
      purpose: input.purpose,
      channel: input.channel,
      granted: input.granted,
      source: input.source,
      evidence: input.evidence,
      policyVersion: input.policyVersion,
    });
    await this.pool.query(
      `
      INSERT INTO consent_events (
        id, user_id, purpose, channel, granted, source, policy_version, evidence, recorded_at, withdrawn_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9::timestamptz,$10::timestamptz)
      `,
      [
        event.id,
        input.userId,
        event.purpose,
        event.channel,
        event.granted,
        event.source,
        event.policyVersion,
        event.evidence,
        event.recordedAt,
        event.withdrawnAt,
      ],
    );
    logger.info('consent.event_recorded', {
      userId: input.userId,
      purpose: input.purpose,
      granted: input.granted,
      source: input.source,
      policyVersion: event.policyVersion,
    });
    return event;
  }

  async ensureTransactional(userId: string): Promise<void> {
    const statuses = await this.getStatuses(userId);
    if (statuses.some((status) => status.purpose === 'transactional_email')) {
      return;
    }
    await this.record({
      userId,
      purpose: 'transactional_email',
      channel: 'email',
      granted: true,
      source: 'registration',
      evidence: 'account registration implies transactional notices',
    });
  }

  async issueUnsubscribeToken(userId: string, purpose: ConsentPurpose): Promise<string> {
    const token = crypto.randomUUID();
    await this.pool.query(
      `INSERT INTO consent_unsubscribe_tokens (token, user_id, purpose) VALUES ($1,$2,$3)`,
      [token, userId, purpose],
    );
    return token;
  }

  async withdrawByUnsubscribeToken(token: string): Promise<ConsentEvent | null> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await client.query<{ user_id: string; purpose: ConsentPurpose; used_at: Date | null }>(
        `SELECT user_id, purpose, used_at FROM consent_unsubscribe_tokens WHERE token = $1 FOR UPDATE`,
        [token],
      );
      const row = result.rows[0];
      if (!row || row.used_at) {
        await client.query('ROLLBACK');
        return null;
      }
      await client.query(`UPDATE consent_unsubscribe_tokens SET used_at = now() WHERE token = $1`, [
        token,
      ]);
      await client.query('COMMIT');
      return this.record({
        userId: row.user_id,
        purpose: row.purpose,
        channel: purposeToChannel(row.purpose),
        granted: false,
        source: 'unsubscribe_link',
        evidence: `unsubscribe token ${token}`,
      });
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  async maySend(userId: string, purpose: ConsentPurpose): Promise<boolean> {
    return canSendForPurpose(await this.getStatuses(userId), purpose);
  }

  async listAll(): Promise<
    Array<{ userId: string; statuses: ConsentStatus[]; events: ConsentEvent[] }>
  > {
    const users = await this.pool.query<{ user_id: string }>(
      `SELECT DISTINCT user_id FROM consent_events ORDER BY user_id`,
    );
    const out = [];
    for (const row of users.rows) {
      const events = await this.listEvents(row.user_id);
      out.push({
        userId: row.user_id,
        events,
        statuses: materializeConsentStatuses(events),
      });
    }
    return out;
  }
}
