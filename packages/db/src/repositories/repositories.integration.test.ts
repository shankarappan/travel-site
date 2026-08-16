import { TripOwnershipError, createOrder, createUserId } from '@travel/domain';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import {
  closePool,
  createPool,
  hasDatabaseUrl,
  migrate,
  PostgresCommerceRepository,
  PostgresConsentRepository,
  PostgresConversationRepository,
  PostgresIdentityRepository,
  PostgresTripRepository,
  resetDatabaseForTests,
  upsertAccountFromIdentityRepo,
  type DbPool,
} from '../index.js';

const describeDb = hasDatabaseUrl() ? describe : describe.skip;

describeDb('postgres repositories (integration)', () => {
  let pool: DbPool;

  beforeAll(async () => {
    pool = createPool();
    await resetDatabaseForTests(pool);
    await migrate(pool);
  });

  beforeEach(async () => {
    await resetDatabaseForTests(pool);
    await migrate(pool);
  });

  afterAll(async () => {
    await pool.end();
    await closePool();
  });

  it('identity: magic links and verified-email account linking', async () => {
    const identity = new PostgresIdentityRepository(pool);
    const token = await identity.issueMagicLinkToken('Aroha@Example.com');
    expect(await identity.consumeMagicLinkToken(token)).toBe('aroha@example.com');
    expect(await identity.consumeMagicLinkToken(token)).toBeNull();

    const emailAccount = await upsertAccountFromIdentityRepo(identity, {
      provider: 'email',
      providerSubject: 'aroha@example.com',
      email: 'aroha@example.com',
      emailVerified: true,
    });
    const linked = await upsertAccountFromIdentityRepo(identity, {
      provider: 'google',
      providerSubject: 'google-42',
      email: 'aroha@example.com',
      emailVerified: true,
    });
    expect(linked.id.value).toBe(emailAccount.id.value);
    expect(linked.identities).toHaveLength(2);

    await expect(
      upsertAccountFromIdentityRepo(identity, {
        provider: 'apple',
        providerSubject: 'apple-9',
        email: 'aroha@example.com',
        emailVerified: false,
      }),
    ).rejects.toThrow(/verified method/i);
  });

  it('consent: records preferences, unsubscribe, and listAll', async () => {
    const identity = new PostgresIdentityRepository(pool);
    const consent = new PostgresConsentRepository(pool);
    const account = await upsertAccountFromIdentityRepo(identity, {
      provider: 'email',
      providerSubject: 'consent@example.com',
      email: 'consent@example.com',
      emailVerified: true,
    });
    const userId = account.id.value;

    await consent.ensureTransactional(userId);
    await consent.record({
      userId,
      purpose: 'marketing_email',
      channel: 'email',
      granted: true,
      source: 'preferences_ui',
      evidence: 'toggle on',
    });
    expect(await consent.maySend(userId, 'marketing_email')).toBe(true);
    expect((await consent.getStatuses(userId)).length).toBeGreaterThan(0);

    const token = await consent.issueUnsubscribeToken(userId, 'marketing_email');
    expect((await consent.withdrawByUnsubscribeToken(token))?.granted).toBe(false);
    expect(await consent.maySend(userId, 'marketing_email')).toBe(false);

    const all = await consent.listAll();
    expect(all.some((row) => row.userId === userId)).toBe(true);
  });

  it('trips: ownership-scoped list and mutations', async () => {
    const identity = new PostgresIdentityRepository(pool);
    const trips = new PostgresTripRepository(pool);
    const userA = await upsertAccountFromIdentityRepo(identity, {
      provider: 'email',
      providerSubject: 'a@example.com',
      email: 'a@example.com',
      emailVerified: true,
    });
    const userB = await upsertAccountFromIdentityRepo(identity, {
      provider: 'email',
      providerSubject: 'b@example.com',
      email: 'b@example.com',
      emailVerified: true,
    });

    const mine = await trips.create(userA.id.value, 'Mine');
    await trips.create(userB.id.value, 'Theirs');
    expect(await trips.listForUser(userA.id.value)).toHaveLength(1);
    expect((await trips.listForUser(userA.id.value))[0]?.id).toBe(mine.id);

    await expect(trips.getForUser(mine.id, userB.id.value)).rejects.toBeInstanceOf(
      TripOwnershipError,
    );

    const renamed = await trips.rename(mine.id, userA.id.value, 'Renamed');
    expect(renamed.title).toBe('Renamed');

    const dayId = renamed.days[0]!.id;
    await trips.addItem(mine.id, userA.id.value, {
      dayId,
      kind: 'note',
      title: 'First',
    });
    const second = await trips.addItem(mine.id, userA.id.value, {
      dayId,
      kind: 'note',
      title: 'Second',
    });
    const ids = second.days[0]!.items.map((item) => item.id);
    const reordered = await trips.reorderItems(mine.id, userA.id.value, dayId, [
      ids[1]!,
      ids[0]!,
    ]);
    expect(reordered.days[0]!.items[0]!.title).toBe('Second');
    const deleted = await trips.deleteItem(mine.id, userA.id.value, dayId, ids[1]!);
    expect(deleted.days[0]!.items).toHaveLength(1);
    expect(deleted.days[0]!.items[0]!.id).toBe(ids[0]);
  });

  it('conversations: private data blocked until account link verified', async () => {
    const identity = new PostgresIdentityRepository(pool);
    const conversations = new PostgresConversationRepository(pool);
    const account = await upsertAccountFromIdentityRepo(identity, {
      provider: 'email',
      providerSubject: 'channel@example.com',
      email: 'channel@example.com',
      emailVerified: true,
    });

    const thread = await conversations.create({
      channel: 'whatsapp',
      externalId: '+6421000000',
    });
    await conversations.appendMessage(thread.id, {
      role: 'inbound',
      direction: 'inbound',
      body: 'Where is my booking?',
    });
    expect(thread.verified).toBe(false);

    const code = await conversations.issueAccountLinkCode(account.id.value);
    const linked = await conversations.verifyAccountLink(thread.id, code);
    expect(linked.verified).toBe(true);
    expect(linked.linkedUserId).toBe(account.id.value);
  });

  it('commerce: persists orders, payments, webhook idempotency, and email intents', async () => {
    const identity = new PostgresIdentityRepository(pool);
    const commerce = new PostgresCommerceRepository(pool);
    const account = await upsertAccountFromIdentityRepo(identity, {
      provider: 'email',
      providerSubject: 'buyer@example.com',
      email: 'buyer@example.com',
      emailVerified: true,
    });

    const order = await commerce.saveOrder(
      createOrder({
        userId: account.id.value,
        quoteId: 'quote_1',
        idempotencyKey: 'idem-1',
        lines: [
          {
            offerId: 'lakeview-lodge:2026-12-01:2026-12-03:2:0',
            propertyName: 'Lakeview Lodge',
            checkIn: '2026-12-01',
            checkOut: '2026-12-03',
            totalMinor: 42_000,
            currency: 'NZD',
            cancellationTerms: 'Free cancellation',
          },
        ],
      }),
    );

    const payment = await commerce.savePayment({
      id: `pay_${crypto.randomUUID()}`,
      orderId: order.id,
      amountMinor: 42_000,
      currency: 'NZD',
      status: 'requires_payment',
      providerRef: `sandbox_pi_${crypto.randomUUID()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    const first = await commerce.recordWebhookEvent({
      eventId: 'evt_1',
      source: 'payments',
      providerRef: payment.providerRef,
      status: 'succeeded',
    });
    expect(first.duplicate).toBe(false);
    const duplicate = await commerce.recordWebhookEvent({
      eventId: 'evt_1',
      source: 'payments',
      providerRef: payment.providerRef,
      status: 'succeeded',
    });
    expect(duplicate.duplicate).toBe(true);

    await commerce.queueEmail({
      template: 'booking.confirmed',
      version: '1.0.0',
      to: 'buyer@example.com',
      orderId: order.id,
    });
    expect(
      (await commerce.listEmailIntents()).some((email) => email.template === 'booking.confirmed'),
    ).toBe(true);

    expect(order.userId.value).toBe(createUserId(account.id.value).value);
  });
});
