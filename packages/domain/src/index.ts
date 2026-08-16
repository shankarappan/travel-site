export type { Role, UserId } from './user.js';
export { createUserId } from './user.js';

export type { Money, OrderStatus } from './order.js';
export { assertPositiveMoney, canTransitionOrder, transitionOrder } from './order.js';

export type { IdentityProvider, LinkedIdentity, SessionRecord, UserAccount } from './identity.js';
export {
  AccountLinkingError,
  createUserAccount,
  findIdentity,
  hasRole,
  isSessionActive,
  linkIdentity,
  normalizeEmail,
  resolveAccountForSignIn,
} from './identity.js';

export type {
  ConsentChannel,
  ConsentEvent,
  ConsentPurpose,
  ConsentSource,
  ConsentStatus,
} from './consent.js';
export {
  CURRENT_CONSENT_POLICY_VERSION,
  MARKETING_PURPOSES,
  canSendForPurpose,
  createConsentEvent,
  isMarketingPurpose,
  materializeConsentStatuses,
} from './consent.js';

export type { ItineraryItem, ItineraryItemKind, Trip, TripDay } from './trip.js';
export {
  TripNotFoundError,
  TripOwnershipError,
  addItineraryItem,
  assertTripOwner,
  createTrip,
  deleteItineraryItem,
  renameTrip,
  reorderItineraryItems,
} from './trip.js';
