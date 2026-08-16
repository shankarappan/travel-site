import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SignInForm } from '../../components/sign-in-form';
import { auth } from '../../server/identity/auth';
import { isAppleAuthEnabled, isGoogleAuthEnabled } from '../../server/identity/providers';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'Sign in',
};

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) {
    redirect('/account');
  }

  const googleEnabled = isGoogleAuthEnabled();
  const appleEnabled = isAppleAuthEnabled();

  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-10 sm:px-6 sm:py-14">
      <h1 className="travel-h1 text-[var(--travel-color-ink)]">Welcome back</h1>
      <p className="mt-2 mb-8 max-w-xl text-[var(--travel-color-ink-soft)]">
        Sign in to save trips, manage preferences, and pick up where you left off.
      </p>
      <Suspense fallback={<p>Loading sign-in…</p>}>
        <SignInForm googleEnabled={googleEnabled} appleEnabled={appleEnabled} />
      </Suspense>
    </div>
  );
}
