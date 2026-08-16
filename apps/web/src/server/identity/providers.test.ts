import { describe, expect, it } from 'vitest';
import { isAppleAuthEnabled, isGoogleAuthEnabled, oauthCallbackUrl } from './providers';

describe('oauth provider enablement', () => {
  it('requires both Google credentials', () => {
    expect(isGoogleAuthEnabled({})).toBe(false);
    expect(isGoogleAuthEnabled({ AUTH_GOOGLE_ID: 'id' })).toBe(false);
    expect(isGoogleAuthEnabled({ AUTH_GOOGLE_ID: 'id', AUTH_GOOGLE_SECRET: 'secret' })).toBe(true);
    expect(isGoogleAuthEnabled({ AUTH_GOOGLE_ID: ' ', AUTH_GOOGLE_SECRET: 'secret' })).toBe(false);
  });

  it('requires both Apple credentials', () => {
    expect(isAppleAuthEnabled({ AUTH_APPLE_ID: 'id' })).toBe(false);
    expect(isAppleAuthEnabled({ AUTH_APPLE_ID: 'id', AUTH_APPLE_SECRET: 'secret' })).toBe(true);
  });

  it('builds production callback URLs', () => {
    expect(oauthCallbackUrl('google', 'https://travel-site-chi-five.vercel.app')).toBe(
      'https://travel-site-chi-five.vercel.app/api/auth/callback/google',
    );
    expect(oauthCallbackUrl('apple', 'https://travel-site-chi-five.vercel.app/')).toBe(
      'https://travel-site-chi-five.vercel.app/api/auth/callback/apple',
    );
  });
});
