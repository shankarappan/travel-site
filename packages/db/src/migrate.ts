import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createLogger } from '@travel/observability';
import type { DbPool } from './pool.js';

const logger = createLogger({ service: 'db-migrate' });

export function defaultMigrationsDir(): string {
  const here = path.dirname(fileURLToPath(import.meta.url));
  // packages/db/src -> repo root infra/migrations (dev) or packages/db/dist -> ../../infra/migrations
  return path.resolve(here, '../../../infra/migrations');
}

export async function migrate(pool: DbPool, migrationsDir = defaultMigrationsDir()): Promise<string[]> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    )
  `);

  const files = (await readdir(migrationsDir))
    .filter((name) => name.endsWith('.sql'))
    .sort();

  const applied: string[] = [];
  for (const file of files) {
    const id = file;
    const existing = await pool.query<{ id: string }>(
      'SELECT id FROM schema_migrations WHERE id = $1',
      [id],
    );
    if (existing.rowCount && existing.rowCount > 0) {
      continue;
    }

    const sql = await readFile(path.join(migrationsDir, file), 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (id) VALUES ($1)', [id]);
      await client.query('COMMIT');
      applied.push(id);
      logger.info('db.migration_applied', { id });
    } catch (error) {
      await client.query('ROLLBACK');
      logger.error('db.migration_failed', {
        id,
        message: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    } finally {
      client.release();
    }
  }
  return applied;
}

export async function resetDatabaseForTests(pool: DbPool): Promise<void> {
  await pool.query(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO CURRENT_USER;
    GRANT ALL ON SCHEMA public TO public;
  `);
}
