import {
  getPool,
  PostgresCommerceRepository,
  PostgresConsentRepository,
  PostgresConversationRepository,
  PostgresIdentityRepository,
  PostgresTripRepository,
  type CommerceRepository,
  type ConsentRepository,
  type ConversationRepository,
  type IdentityRepository,
  type TripRepository,
} from '@travel/db';

let identityRepo: IdentityRepository | null = null;
let consentRepo: ConsentRepository | null = null;
let tripRepo: TripRepository | null = null;
let commerceRepo: CommerceRepository | null = null;
let conversationRepo: ConversationRepository | null = null;

export function identityRepository(): IdentityRepository {
  if (!identityRepo) identityRepo = new PostgresIdentityRepository(getPool());
  return identityRepo;
}

export function consentRepository(): ConsentRepository {
  if (!consentRepo) consentRepo = new PostgresConsentRepository(getPool());
  return consentRepo;
}

export function tripRepository(): TripRepository {
  if (!tripRepo) tripRepo = new PostgresTripRepository(getPool());
  return tripRepo;
}

export function commerceRepository(): CommerceRepository {
  if (!commerceRepo) commerceRepo = new PostgresCommerceRepository(getPool());
  return commerceRepo;
}

export function conversationRepository(): ConversationRepository {
  if (!conversationRepo) conversationRepo = new PostgresConversationRepository(getPool());
  return conversationRepo;
}

/** Test helper to inject repositories without touching the shared pool wiring. */
export function setRepositoriesForTests(input: {
  identity?: IdentityRepository;
  consent?: ConsentRepository;
  trips?: TripRepository;
  commerce?: CommerceRepository;
  conversations?: ConversationRepository;
}): void {
  if (input.identity) identityRepo = input.identity;
  if (input.consent) consentRepo = input.consent;
  if (input.trips) tripRepo = input.trips;
  if (input.commerce) commerceRepo = input.commerce;
  if (input.conversations) conversationRepo = input.conversations;
}

export function resetRepositorySingletons(): void {
  identityRepo = null;
  consentRepo = null;
  tripRepo = null;
  commerceRepo = null;
  conversationRepo = null;
}
