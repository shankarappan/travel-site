import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignInForm } from '../../components/sign-in-form';
import { auth } from '../../server/identity/auth';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/account');
  }

  const googleEnabled = Boolean(process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET);
  const appleEnabled = Boolean(process.env.AUTH_APPLE_ID && process.env.AUTH_APPLE_SECRET);

  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)]">
        Sign in
      </h1>
      <p className="mt-2 mb-8 max-w-xl text-[var(--travel-color-ink-soft)]">
        Email magic link, Google, or Apple — all map to one internal user ID. OAuth secrets stay on
        the server.
      </p>
      <Suspense fallback={<p>Loading sign-in…</p>}>
        <SignInForm googleEnabled={googleEnabled} appleEnabled={appleEnabled} />
      </Suspense>
    </div>
  );
}
