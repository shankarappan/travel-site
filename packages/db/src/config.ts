import { z } from 'zod';

export const databaseEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required for durable storage'),
  DATABASE_POOL_MAX: z.coerce.number().int().positive().max(50).default(10),
});

export type DatabaseEnv = z.infer<typeof databaseEnvSchema>;

export function loadDatabaseEnv(source: NodeJS.ProcessEnv = process.env): DatabaseEnv {
  return databaseEnvSchema.parse(source);
}

export function tryLoadDatabaseUrl(source: NodeJS.ProcessEnv = process.env): string | null {
  const value = source.DATABASE_URL?.trim();
  return value ? value : null;
}
