export { databaseEnvSchema, loadDatabaseEnv, tryLoadDatabaseUrl } from './config.js';
export type { DatabaseEnv } from './config.js';

export {
  checkDatabaseHealth,
  closePool,
  createPool,
  getPool,
  hasDatabaseUrl,
  withTransaction,
} from './pool.js';
export type { DbClient, DbPool } from './pool.js';

export { defaultMigrationsDir, migrate, resetDatabaseForTests } from './migrate.js';

export type {
  CommerceRepository,
  ConsentRepository,
  ConversationChannel,
  ConversationMessageRecord,
  ConversationRecord,
  ConversationRepository,
  EmailIntentRecord,
  IdentityRepository,
  TripRepository,
} from './repositories/types.js';

export {
  PostgresIdentityRepository,
  upsertAccountFromIdentityRepo,
} from './repositories/identity.js';
export { PostgresConsentRepository } from './repositories/consent.js';
export { PostgresTripRepository } from './repositories/trips.js';
export { PostgresCommerceRepository } from './repositories/commerce.js';
export { PostgresConversationRepository } from './repositories/conversations.js';
