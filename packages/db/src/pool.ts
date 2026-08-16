import { createLogger } from '@travel/observability';
import pg from 'pg';
import { loadDatabaseEnv, tryLoadDatabaseUrl } from './config.js';

const { Pool } = pg;
const logger = createLogger({ service: 'db' });

export type DbPool = pg.Pool;
export type DbClient = pg.PoolClient;

let sharedPool: DbPool | null = null;

export function createPool(connectionString?: string, max?: number): DbPool {
  const url = connectionString ?? loadDatabaseEnv().DATABASE_URL;
  const poolMax = max ?? loadDatabaseEnv().DATABASE_POOL_MAX;
  return new Pool({
    connectionString: url,
    max: poolMax,
    idleTimeoutMillis: 30_000,
  });
}

export function getPool(): DbPool {
  if (!sharedPool) {
    sharedPool = createPool();
    sharedPool.on('error', (error) => {
      logger.error('db.pool_error', { message: error.message });
    });
  }
  return sharedPool;
}

export async function closePool(): Promise<void> {
  if (sharedPool) {
    await sharedPool.end();
    sharedPool = null;
  }
}

export function hasDatabaseUrl(): boolean {
  return Boolean(tryLoadDatabaseUrl());
}

export async function checkDatabaseHealth(pool: DbPool = getPool()): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
}> {
  const started = Date.now();
  try {
    await pool.query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - started };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - started,
      error: error instanceof Error ? error.message : 'unknown database error',
    };
  }
}

export async function withTransaction<T>(
  pool: DbPool,
  fn: (client: DbClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
