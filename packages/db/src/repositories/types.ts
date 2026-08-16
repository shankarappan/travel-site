import type {
  ConsentChannel,
  ConsentEvent,
  ConsentPurpose,
  ConsentSource,
  ConsentStatus,
  IdentityProvider,
  ItineraryItemKind,
  Order,
  OrderLine,
  PaymentRecord,
  PaymentStatus,
  Trip,
  UserAccount,
} from '@travel/domain';

export type IssueMagicLinkTokenInput = {
  email: string;
  ttlMs?: number;
  requestIp?: string | null;
};

export type CountMagicLinkRequestsInput = {
  email?: string;
  requestIp?: string | null;
  windowMs: number;
};

export interface IdentityRepository {
  getById(id: string): Promise<UserAccount | null>;
  findByProviderSubject(
    provider: IdentityProvider,
    providerSubject: string,
  ): Promise<UserAccount | null>;
  findByVerifiedEmail(email: string): Promise<UserAccount[]>;
  save(account: UserAccount): Promise<UserAccount>;
  /** Issues a raw token for emailing; persists only a hash. */
  issueMagicLinkToken(
    emailOrInput: string | IssueMagicLinkTokenInput,
    ttlMs?: number,
  ): Promise<string>;
  consumeMagicLinkToken(token: string): Promise<string | null>;
  countRecentMagicLinkRequests(input: CountMagicLinkRequestsInput): Promise<number>;
}

export interface ConsentRepository {
  listEvents(userId: string): Promise<ConsentEvent[]>;
  getStatuses(userId: string): Promise<ConsentStatus[]>;
  record(input: {
    userId: string;
    purpose: ConsentPurpose;
    channel: ConsentChannel;
    granted: boolean;
    source: ConsentSource;
    evidence: string;
    policyVersion?: string;
  }): Promise<ConsentEvent>;
  ensureTransactional(userId: string): Promise<void>;
  issueUnsubscribeToken(userId: string, purpose: ConsentPurpose): Promise<string>;
  withdrawByUnsubscribeToken(token: string): Promise<ConsentEvent | null>;
  maySend(userId: string, purpose: ConsentPurpose): Promise<boolean>;
  listAll(): Promise<Array<{ userId: string; statuses: ConsentStatus[]; events: ConsentEvent[] }>>;
}

export interface TripRepository {
  listForUser(userId: string): Promise<Trip[]>;
  getForUser(tripId: string, userId: string): Promise<Trip>;
  create(userId: string, title: string): Promise<Trip>;
  rename(tripId: string, userId: string, title: string): Promise<Trip>;
  delete(tripId: string, userId: string): Promise<void>;
  addItem(
    tripId: string,
    userId: string,
    input: {
      dayId: string;
      kind: ItineraryItemKind;
      title: string;
      notes?: string | null;
      refSlug?: string | null;
    },
  ): Promise<Trip>;
  reorderItems(
    tripId: string,
    userId: string,
    dayId: string,
    orderedItemIds: readonly string[],
  ): Promise<Trip>;
  deleteItem(tripId: string, userId: string, dayId: string, itemId: string): Promise<Trip>;
}

export interface EmailIntentRecord {
  id: string;
  template: string;
  version: string;
  to: string;
  status: 'queued' | 'sent' | 'failed';
  providerMessageId: string | null;
  orderId: string | null;
}

export interface CommerceRepository {
  findOrderByIdempotency(userId: string, idempotencyKey: string): Promise<Order | null>;
  getOrderById(orderId: string): Promise<Order | null>;
  getOrderForUser(orderId: string, userId: string): Promise<Order>;
  saveOrder(order: Order, lines?: readonly OrderLine[]): Promise<Order>;
  savePayment(payment: PaymentRecord): Promise<PaymentRecord>;
  getPayment(paymentId: string): Promise<PaymentRecord | null>;
  findPaymentByProviderRef(providerRef: string): Promise<PaymentRecord | null>;
  recordWebhookEvent(input: {
    eventId: string;
    source: string;
    providerRef?: string;
    status?: string;
  }): Promise<{ duplicate: boolean }>;
  saveBookingAttempt(input: {
    id: string;
    orderId: string;
    idempotencyKey: string;
    providerBookingId: string | null;
    status: string;
  }): Promise<{ created: boolean; providerBookingId: string | null; status: string }>;
  queueEmail(input: {
    template: string;
    version: string;
    to: string;
    orderId?: string | null;
  }): Promise<EmailIntentRecord>;
  listEmailIntents(): Promise<EmailIntentRecord[]>;
  listOrders(): Promise<Order[]>;
  listPaidUnconfirmed(): Promise<Order[]>;
  recordStatusTransition(input: {
    orderId: string;
    fromStatus: string | null;
    toStatus: string;
    reason?: string;
  }): Promise<void>;
}

export type ConversationChannel = 'web' | 'whatsapp' | 'telegram' | 'voice';

export interface ConversationMessageRecord {
  id: string;
  role: string;
  direction: 'inbound' | 'outbound' | null;
  body: string;
  toolName?: string | null;
  createdAt: string;
}

export interface ConversationRecord {
  id: string;
  userId: string | null;
  channel: ConversationChannel | null;
  channelExternalId: string | null;
  linkedUserId: string | null;
  verified: boolean;
  messages: ConversationMessageRecord[];
  createdAt: string;
  updatedAt: string;
}

export interface ConversationRepository {
  create(input: {
    id?: string;
    userId?: string | null;
    channel?: ConversationChannel;
    externalId?: string;
  }): Promise<ConversationRecord>;
  get(id: string): Promise<ConversationRecord | null>;
  findByChannel(
    channel: ConversationChannel,
    externalId: string,
  ): Promise<ConversationRecord | null>;
  appendMessage(
    conversationId: string,
    message: Omit<ConversationMessageRecord, 'id' | 'createdAt'> & {
      id?: string;
      createdAt?: string;
    },
  ): Promise<ConversationRecord>;
  issueAccountLinkCode(userId: string): Promise<string>;
  verifyAccountLink(conversationId: string, code: string): Promise<ConversationRecord>;
  list(): Promise<ConversationRecord[]>;
}

export type { PaymentStatus };
