import {
  createUserId,
  type Order,
  type OrderLine,
  type OrderStatus,
  type PaymentRecord,
  type PaymentStatus,
} from '@travel/domain';
import type { DbPool } from '../pool.js';
import type { CommerceRepository, EmailIntentRecord } from './types.js';

type OrderRow = {
  id: string;
  user_id: string;
  status: OrderStatus;
  quote_id: string | null;
  payment_id: string | null;
  provider_booking_id: string | null;
  idempotency_key: string;
  created_at: Date;
  updated_at: Date;
};

type LineRow = {
  offer_id: string;
  property_name: string;
  check_in: string | null;
  check_out: string | null;
  total_minor: number;
  currency: string;
  cancellation_terms: string;
};

type PaymentRow = {
  id: string;
  order_id: string;
  amount_minor: number;
  currency: string;
  status: PaymentStatus;
  provider_ref: string;
  created_at: Date;
  updated_at: Date;
};

function mapOrder(row: OrderRow, lines: LineRow[]): Order {
  return {
    id: row.id,
    userId: createUserId(row.user_id),
    status: row.status,
    quoteId: row.quote_id,
    paymentId: row.payment_id,
    providerBookingId: row.provider_booking_id,
    idempotencyKey: row.idempotency_key,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
    lines: lines.map((line) => ({
      offerId: line.offer_id,
      propertyName: line.property_name,
      checkIn: line.check_in ?? '',
      checkOut: line.check_out ?? '',
      totalMinor: line.total_minor,
      currency: line.currency,
      cancellationTerms: line.cancellation_terms,
    })),
  };
}

function mapPayment(row: PaymentRow): PaymentRecord {
  return {
    id: row.id,
    orderId: row.order_id,
    amountMinor: row.amount_minor,
    currency: row.currency,
    status: row.status,
    providerRef: row.provider_ref,
    createdAt: row.created_at.toISOString(),
    updatedAt: row.updated_at.toISOString(),
  };
}

export class PostgresCommerceRepository implements CommerceRepository {
  constructor(private readonly pool: DbPool) {}

  private async loadOrder(orderId: string): Promise<Order | null> {
    const orderResult = await this.pool.query<OrderRow>(`SELECT * FROM orders WHERE id = $1`, [
      orderId,
    ]);
    const row = orderResult.rows[0];
    if (!row) return null;
    const lines = await this.pool.query<LineRow>(
      `SELECT offer_id, property_name, check_in, check_out, total_minor, currency, cancellation_terms
       FROM order_lines WHERE order_id = $1`,
      [orderId],
    );
    return mapOrder(row, lines.rows);
  }

  async findOrderByIdempotency(userId: string, idempotencyKey: string): Promise<Order | null> {
    const result = await this.pool.query<{ id: string }>(
      `SELECT id FROM orders WHERE user_id = $1 AND idempotency_key = $2`,
      [userId, idempotencyKey],
    );
    const id = result.rows[0]?.id;
    if (!id) return null;
    return this.loadOrder(id);
  }

  async getOrderById(orderId: string): Promise<Order | null> {
    return this.loadOrder(orderId);
  }

  async getOrderForUser(orderId: string, userId: string): Promise<Order> {
    const order = await this.loadOrder(orderId);
    if (!order || order.userId.value !== userId) {
      throw new Error('Order not found');
    }
    return order;
  }

  async saveOrder(order: Order, lines?: readonly OrderLine[]): Promise<Order> {
    const orderLines = lines ?? order.lines;
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(
        `
        INSERT INTO orders (
          id, user_id, status, quote_id, payment_id, provider_booking_id,
          idempotency_key, created_at, updated_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8::timestamptz,$9::timestamptz)
        ON CONFLICT (id) DO UPDATE SET
          status = EXCLUDED.status,
          quote_id = EXCLUDED.quote_id,
          payment_id = EXCLUDED.payment_id,
          provider_booking_id = EXCLUDED.provider_booking_id,
          updated_at = EXCLUDED.updated_at
        `,
        [
          order.id,
          order.userId.value,
          order.status,
          order.quoteId,
          order.paymentId,
          order.providerBookingId,
          order.idempotencyKey,
          order.createdAt,
          order.updatedAt,
        ],
      );
      await client.query(`DELETE FROM order_lines WHERE order_id = $1`, [order.id]);
      for (const line of orderLines) {
        await client.query(
          `
          INSERT INTO order_lines (
            id, order_id, offer_id, property_name, check_in, check_out,
            total_minor, currency, cancellation_terms
          ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
          `,
          [
            crypto.randomUUID(),
            order.id,
            line.offerId,
            line.propertyName,
            line.checkIn,
            line.checkOut,
            line.totalMinor,
            line.currency,
            line.cancellationTerms,
          ],
        );
      }
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
    return (await this.loadOrder(order.id)) ?? order;
  }

  async savePayment(payment: PaymentRecord): Promise<PaymentRecord> {
    await this.pool.query(
      `
      INSERT INTO payments (
        id, order_id, amount_minor, currency, status, provider_ref, created_at, updated_at
      ) VALUES ($1,$2,$3,$4,$5,$6,$7::timestamptz,$8::timestamptz)
      ON CONFLICT (id) DO UPDATE SET
        status = EXCLUDED.status,
        updated_at = EXCLUDED.updated_at
      `,
      [
        payment.id,
        payment.orderId,
        payment.amountMinor,
        payment.currency,
        payment.status,
        payment.providerRef,
        payment.createdAt,
        payment.updatedAt,
      ],
    );
    return payment;
  }

  async getPayment(paymentId: string): Promise<PaymentRecord | null> {
    const result = await this.pool.query<PaymentRow>(`SELECT * FROM payments WHERE id = $1`, [
      paymentId,
    ]);
    const row = result.rows[0];
    return row ? mapPayment(row) : null;
  }

  async findPaymentByProviderRef(providerRef: string): Promise<PaymentRecord | null> {
    const result = await this.pool.query<PaymentRow>(
      `SELECT * FROM payments WHERE provider_ref = $1`,
      [providerRef],
    );
    const row = result.rows[0];
    return row ? mapPayment(row) : null;
  }

  async recordWebhookEvent(input: {
    eventId: string;
    source: string;
    providerRef?: string;
    status?: string;
  }): Promise<{ duplicate: boolean }> {
    const result = await this.pool.query(
      `
      INSERT INTO webhook_events (event_id, source, provider_ref, status)
      VALUES ($1,$2,$3,$4)
      ON CONFLICT (event_id) DO NOTHING
      `,
      [input.eventId, input.source, input.providerRef ?? null, input.status ?? null],
    );
    return { duplicate: (result.rowCount ?? 0) === 0 };
  }

  async saveBookingAttempt(input: {
    id: string;
    orderId: string;
    idempotencyKey: string;
    providerBookingId: string | null;
    status: string;
  }): Promise<{ created: boolean; providerBookingId: string | null; status: string }> {
    const result = await this.pool.query<{
      provider_booking_id: string | null;
      status: string;
      xmax: string;
    }>(
      `
      INSERT INTO booking_attempts (id, order_id, idempotency_key, provider_booking_id, status)
      VALUES ($1,$2,$3,$4,$5)
      ON CONFLICT (idempotency_key) DO UPDATE SET
        provider_booking_id = COALESCE(EXCLUDED.provider_booking_id, booking_attempts.provider_booking_id),
        status = EXCLUDED.status,
        updated_at = now()
      RETURNING provider_booking_id, status, xmax::text
      `,
      [input.id, input.orderId, input.idempotencyKey, input.providerBookingId, input.status],
    );
    const row = result.rows[0]!;
    // xmax = 0 means newly inserted in Postgres
    const created = row.xmax === '0';
    return {
      created,
      providerBookingId: row.provider_booking_id,
      status: row.status,
    };
  }

  async queueEmail(input: {
    template: string;
    version: string;
    to: string;
    orderId?: string | null;
  }): Promise<EmailIntentRecord> {
    const record: EmailIntentRecord = {
      id: `email_${crypto.randomUUID()}`,
      template: input.template,
      version: input.version,
      to: input.to,
      status: 'sent',
      providerMessageId: `msg_${crypto.randomUUID()}`,
      orderId: input.orderId ?? null,
    };
    await this.pool.query(
      `
      INSERT INTO email_intents (
        id, template, version, to_address, status, provider_message_id, order_id
      ) VALUES ($1,$2,$3,$4,$5,$6,$7)
      `,
      [
        record.id,
        record.template,
        record.version,
        record.to,
        record.status,
        record.providerMessageId,
        record.orderId,
      ],
    );
    return record;
  }

  async listEmailIntents(): Promise<EmailIntentRecord[]> {
    const result = await this.pool.query<{
      id: string;
      template: string;
      version: string;
      to_address: string;
      status: 'queued' | 'sent' | 'failed';
      provider_message_id: string | null;
      order_id: string | null;
    }>(`SELECT * FROM email_intents ORDER BY created_at`);
    return result.rows.map((row) => ({
      id: row.id,
      template: row.template,
      version: row.version,
      to: row.to_address,
      status: row.status,
      providerMessageId: row.provider_message_id,
      orderId: row.order_id,
    }));
  }

  async listOrders(): Promise<Order[]> {
    const result = await this.pool.query<{ id: string }>(
      `SELECT id FROM orders ORDER BY created_at`,
    );
    const orders: Order[] = [];
    for (const row of result.rows) {
      const order = await this.loadOrder(row.id);
      if (order) orders.push(order);
    }
    return orders;
  }

  async listPaidUnconfirmed(): Promise<Order[]> {
    const result = await this.pool.query<{ id: string }>(
      `SELECT id FROM orders WHERE status IN ('PAID', 'SUPPLIER_PENDING')`,
    );
    const orders: Order[] = [];
    for (const row of result.rows) {
      const order = await this.loadOrder(row.id);
      if (order) orders.push(order);
    }
    return orders;
  }

  async recordStatusTransition(input: {
    orderId: string;
    fromStatus: string | null;
    toStatus: string;
    reason?: string;
  }): Promise<void> {
    await this.pool.query(
      `
      INSERT INTO order_status_events (id, order_id, from_status, to_status, reason)
      VALUES ($1,$2,$3,$4,$5)
      `,
      [crypto.randomUUID(), input.orderId, input.fromStatus, input.toStatus, input.reason ?? null],
    );
  }
}
