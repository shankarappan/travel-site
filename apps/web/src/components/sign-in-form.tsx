'use client';

import { Button, Field, Input } from '@travel/ui';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

export function SignInForm({
  googleEnabled,
  appleEnabled,
}: {
  googleEnabled: boolean;
  appleEnabled: boolean;
}) {
  const params = useSearchParams();
  const error = params.get('error');
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'sent' | 'failed'>('idle');
  const [devLink, setDevLink] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('loading');
    setMessage(null);
    setDevLink(null);
    try {
      const response = await fetch('/api/auth/request-magic-link', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        ok?: boolean;
        error?: string;
        message?: string;
        devMagicLink?: string;
      };
      if (!response.ok) {
        setStatus('failed');
        setMessage(data.error ?? 'Could not start sign-in');
        return;
      }
      setStatus('sent');
      setMessage(data.message ?? 'Check your email for a sign-in link.');
      if (data.devMagicLink) {
        setDevLink(data.devMagicLink);
      }
    } catch {
      setStatus('failed');
      setMessage('Network error while requesting magic link');
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6">
      {error ? (
        <p role="alert" className="text-sm text-[var(--travel-color-danger)]">
          Sign-in could not be completed ({error.replaceAll('_', ' ')}).
        </p>
      ) : null}

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field id="email" label="Email" hint="We email a one-time link. No password stored.">
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="you@example.com"
          />
        </Field>
        <Button type="submit" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending link…' : 'Email me a sign-in link'}
        </Button>
      </form>

      {message ? <p className="text-sm text-[var(--travel-color-ink-soft)]">{message}</p> : null}
      {devLink ? (
        <p className="break-all text-sm">
          Dev magic link:{' '}
          <a className="font-semibold text-[var(--travel-color-fern)] underline" href={devLink}>
            Continue sign-in
          </a>
        </p>
      ) : null}

      <div className="flex flex-col gap-2">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--travel-color-ink-soft)]">
          Or continue with
        </p>
        {googleEnabled ? (
          <Button asChild variant="secondary">
            <a href="/api/auth/signin/google">Google</a>
          </Button>
        ) : (
          <Button type="button" variant="secondary" disabled>
            Google (configure AUTH_GOOGLE_ID/SECRET)
          </Button>
        )}
        {appleEnabled ? (
          <Button asChild variant="secondary">
            <a href="/api/auth/signin/apple">Apple</a>
          </Button>
        ) : (
          <Button type="button" variant="secondary" disabled>
            Apple (configure AUTH_APPLE_ID/SECRET)
          </Button>
        )}
      </div>
    </div>
  );
}
