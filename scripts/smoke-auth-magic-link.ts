#!/usr/bin/env tsx
/**
 * Scripted auth smoke: request magic link → follow verify URL → hit /account with session cookie.
 *
 * Usage:
 *   BASE_URL=http://localhost:3000 pnpm exec tsx scripts/smoke-auth-magic-link.ts
 *
 * Requires NODE_ENV !== 'production' so the API returns `devMagicLink`.
 */
const baseUrl = (process.env.BASE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const email = process.env.SMOKE_EMAIL ?? `smoke-${Date.now()}@example.com`;

function fail(message: string): never {
  console.error(`[smoke-auth] ${message}`);
  process.exit(1);
}

async function main() {
  console.log(`[smoke-auth] requesting magic link for ${email} via ${baseUrl}`);
  const request = await fetch(`${baseUrl}/api/auth/request-magic-link`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  const payload = (await request.json()) as {
    ok?: boolean;
    error?: string;
    devMagicLink?: string;
  };
  if (!request.ok || !payload.ok) {
    fail(`request-magic-link failed: ${payload.error ?? request.status}`);
  }
  if (!payload.devMagicLink) {
    fail(
      'No devMagicLink in response. Run against a non-production NODE_ENV app, or use mailbox delivery in production.',
    );
  }

  const verifyUrl = payload.devMagicLink;
  console.log('[smoke-auth] following verify URL');

  let jar = '';
  let current = verifyUrl;
  let landedOnAccount = false;

  for (let i = 0; i < 8; i += 1) {
    const hop = await fetch(current, {
      redirect: 'manual',
      headers: jar ? { cookie: jar } : undefined,
    });
    const nextCookies = hop.headers.getSetCookie?.() ?? [];
    if (nextCookies.length) {
      const merged = new Map<string, string>();
      for (const part of jar.split(';').filter(Boolean)) {
        const [k, ...rest] = part.trim().split('=');
        if (k) merged.set(k, rest.join('='));
      }
      for (const raw of nextCookies) {
        const pair = raw.split(';')[0]!;
        const [k, ...rest] = pair.split('=');
        if (k) merged.set(k, rest.join('='));
      }
      jar = [...merged.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
    }

    const next = hop.headers.get('location');
    if (!next) {
      if (hop.status === 200 && current.includes('/account')) {
        landedOnAccount = true;
      }
      break;
    }
    current = next.startsWith('http') ? next : `${baseUrl}${next}`;
    if (current.includes('/account')) {
      landedOnAccount = true;
      break;
    }
    if (current.includes('/sign-in')) {
      fail(`verify redirected to sign-in (${current})`);
    }
  }

  if (!jar) {
    fail('No session cookie set after verify');
  }

  const account = await fetch(`${baseUrl}/account`, {
    redirect: 'manual',
    headers: { cookie: jar },
  });

  if (account.status === 307 || account.status === 302) {
    const dest = account.headers.get('location') ?? '';
    if (dest.includes('/sign-in')) {
      fail('account redirected to sign-in (session missing)');
    }
    const finalUrl = dest.startsWith('http') ? dest : `${baseUrl}${dest}`;
    const finalRes = await fetch(finalUrl, { headers: { cookie: jar } });
    const html = await finalRes.text();
    if (!finalRes.ok) fail(`final account page HTTP ${finalRes.status}`);
    if (!/Your profile|Sign out|Communication preferences/i.test(html)) {
      fail('Authenticated /account markup not detected');
    }
  } else if (account.status === 200) {
    const html = await account.text();
    if (!/Your profile|Sign out|Communication preferences/i.test(html)) {
      fail('Authenticated /account markup not detected');
    }
  } else {
    fail(`/account HTTP ${account.status}`);
  }

  console.log(
    `[smoke-auth] OK — magic link produced authenticated /account session${landedOnAccount ? '' : ''}`,
  );
}

main().catch((error) => {
  fail(error instanceof Error ? error.message : String(error));
});
