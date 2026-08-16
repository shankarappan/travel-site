import { afterEach, describe, expect, it, vi } from 'vitest';
import { buildAppUrl, resolveCanonicalOrigin } from './urls';

describe('canonical auth URLs', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('prefers AUTH_URL over NEXT_PUBLIC_APP_URL and request host', () => {
    const env = {
      AUTH_URL: 'https://travel.example/',
      NEXT_PUBLIC_APP_URL: 'https://fallback.example',
    };
    expect(resolveCanonicalOrigin('https://internal.vercel.app/api', env)).toBe(
      'https://travel.example',
    );
    expect(
      buildAppUrl(
        '/api/auth/verify-magic-link',
        'https://internal.vercel.app/x',
        { token: 'abc' },
        env,
      ).toString(),
    ).toBe('https://travel.example/api/auth/verify-magic-link?token=abc');
  });

  it('falls back to NEXT_PUBLIC_APP_URL then request origin', () => {
    expect(
      resolveCanonicalOrigin('https://internal.vercel.app/api', {
        NEXT_PUBLIC_APP_URL: 'https://aotearoa.example',
      }),
    ).toBe('https://aotearoa.example');

    expect(
      resolveCanonicalOrigin('http://localhost:3000/api/auth/request-magic-link', {}),
    ).toBe('http://localhost:3000');
  });
});
