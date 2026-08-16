'use client';

import { Button, Field, Input } from '@travel/ui';
import { useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

async function startOAuth(provider: 'google' | 'apple') {
  const csrfResponse = await fetch('/api/auth/csrf');
  const csrfData = (await csrfResponse.json()) as { csrfToken?: string };
  if (!csrfData.csrfToken) {
    throw new Error('Missing CSRF token');
  }
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = `/api/auth/signin/${provider}`;
  form.style.display = 'none';

  const csrf = document.createElement('input');
  csrf.name = 'csrfToken';
  csrf.value = csrfData.csrfToken;
  form.appendChild(csrf);

  const callback = document.createElement('input');
  callback.name = 'callbackUrl';
  callback.value = '/account';
  form.appendChild(callback);

  document.body.appendChild(form);
  form.submit();
}

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
  const [oauthPending, setOauthPending] = useState<'google' | 'apple' | null>(null);

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

  async function onOAuth(provider: 'google' | 'apple') {
    setOauthPending(provider);
    setMessage(null);
    try {
      await startOAuth(provider);
    } catch {
      setOauthPending(null);
      setMessage(`Could not start ${provider} sign-in`);
    }
  }

  const showOauthSection = googleEnabled || appleEnabled;

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
          <a className="font-semibold text-[var(--travel-color-ocean)] underline" href={devLink}>
            Continue sign-in
          </a>
        </p>
      ) : null}

      {showOauthSection ? (
        <div className="flex flex-col gap-2">
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--travel-color-ink-soft)]">
            Or continue with
          </p>
          {googleEnabled ? (
            <Button
              type="button"
              variant="secondary"
              disabled={oauthPending !== null}
              onClick={() => void onOAuth('google')}
            >
              {oauthPending === 'google' ? 'Continuing…' : 'Google'}
            </Button>
          ) : null}
          {appleEnabled ? (
            <Button
              type="button"
              variant="secondary"
              disabled={oauthPending !== null}
              onClick={() => void onOAuth('apple')}
            >
              {oauthPending === 'apple' ? 'Continuing…' : 'Apple'}
            </Button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
