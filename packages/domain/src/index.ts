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
