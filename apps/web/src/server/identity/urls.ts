/**
 * Canonical public origin for auth links and redirects behind proxies (Vercel).
 * Prefers AUTH_URL, then NEXT_PUBLIC_APP_URL, then the incoming request URL.
 */
export function resolveCanonicalOrigin(
  requestUrl: string,
  env: Record<string, string | undefined> = process.env,
): string {
  const candidates = [env.AUTH_URL, env.NEXT_PUBLIC_APP_URL];
  for (const candidate of candidates) {
    const trimmed = candidate?.trim();
    if (!trimmed) continue;
    try {
      const url = new URL(trimmed);
      if (url.protocol === 'http:' || url.protocol === 'https:') {
        return url.origin;
      }
    } catch {
      // ignore invalid configured URLs
    }
  }
  return new URL(requestUrl).origin;
}

export function buildAppUrl(
  pathname: string,
  requestUrl: string,
  searchParams?: Record<string, string>,
  env: Record<string, string | undefined> = process.env,
): URL {
  const origin = resolveCanonicalOrigin(requestUrl, env);
  const url = new URL(pathname, `${origin}/`);
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      url.searchParams.set(key, value);
    }
  }
  return url;
}
