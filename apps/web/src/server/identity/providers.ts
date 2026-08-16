export type OAuthProviderId = 'google' | 'apple';

function nonEmpty(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function isGoogleAuthEnabled(
  env: Record<string, string | undefined> = process.env,
): boolean {
  return Boolean(nonEmpty(env.AUTH_GOOGLE_ID) && nonEmpty(env.AUTH_GOOGLE_SECRET));
}

export function isAppleAuthEnabled(env: Record<string, string | undefined> = process.env): boolean {
  return Boolean(nonEmpty(env.AUTH_APPLE_ID) && nonEmpty(env.AUTH_APPLE_SECRET));
}

export function isOAuthProviderEnabled(
  provider: OAuthProviderId,
  env: Record<string, string | undefined> = process.env,
): boolean {
  return provider === 'google' ? isGoogleAuthEnabled(env) : isAppleAuthEnabled(env);
}

/** Exact Auth.js callback paths owners must register in provider consoles. */
export function oauthCallbackPath(provider: OAuthProviderId): string {
  return `/api/auth/callback/${provider}`;
}

export function oauthCallbackUrl(provider: OAuthProviderId, appOrigin: string): string {
  return new URL(oauthCallbackPath(provider), `${appOrigin.replace(/\/$/, '')}/`).toString();
}
