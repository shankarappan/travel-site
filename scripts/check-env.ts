import { envSchema } from '@travel/observability/env';

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment configuration:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

console.log('Environment validation passed', {
  NODE_ENV: parsed.data.NODE_ENV,
  LOG_LEVEL: parsed.data.LOG_LEVEL,
});
