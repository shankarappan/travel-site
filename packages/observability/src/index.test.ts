import { describe, expect, it, vi } from 'vitest';
import { createLogger, loadEnv } from './index.js';

describe('loadEnv', () => {
  it('applies defaults for local development', () => {
    const env = loadEnv({});
    expect(env.NODE_ENV).toBe('development');
    expect(env.LOG_LEVEL).toBe('info');
  });
});

describe('createLogger', () => {
  it('emits structured JSON at info level', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = createLogger(
      { service: 'test' },
      {
        NODE_ENV: 'test',
        LOG_LEVEL: 'info',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NEXT_PUBLIC_ADMIN_URL: 'http://localhost:3001',
      },
    );
    logger.info('hello', { correlationId: 'abc' });
    expect(spy).toHaveBeenCalled();
    const payload = JSON.parse(String(spy.mock.calls[0]?.[0]));
    expect(payload.msg).toBe('hello');
    expect(payload.service).toBe('test');
    expect(payload.correlationId).toBe('abc');
    spy.mockRestore();
  });

  it('redacts sensitive fields', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => undefined);
    const logger = createLogger(
      { service: 'test' },
      {
        NODE_ENV: 'test',
        LOG_LEVEL: 'info',
        NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
        NEXT_PUBLIC_ADMIN_URL: 'http://localhost:3001',
      },
    );
    logger.info('auth', { accessToken: 'super-secret', userId: 'u1' });
    const payload = JSON.parse(String(spy.mock.calls[0]?.[0]));
    expect(payload.accessToken).toBe('[redacted]');
    expect(payload.userId).toBe('u1');
    spy.mockRestore();
  });
});
