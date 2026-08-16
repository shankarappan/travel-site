'use client';

import {
  Button,
  Card,
  Dialog,
  EmptyState,
  ErrorState,
  Field,
  Input,
  SearchEntry,
  Skeleton,
} from '@travel/ui';
import { useState } from 'react';

export default function DesignSystemPage() {
  const [errorVisible, setErrorVisible] = useState(true);

  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] space-y-10 px-4 py-8 sm:px-6 sm:py-12">
      <header className="max-w-2xl">
        <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)]">
          Design system
        </h1>
        <p className="mt-2 text-[var(--travel-color-ink-soft)]">
          Component review surface for tokens, forms, dialogs, loading and empty/error states.
          Supports 360px mobile upward with reduced-motion respect.
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Buttons</h2>
        <div className="flex flex-wrap gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Search entry</h2>
        <SearchEntry />
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Form field</h2>
        <Card className="max-w-md">
          <Field id="email-demo" label="Email" hint="Used for booking confirmations only.">
            <Input id="email-demo" type="email" placeholder="you@example.com" />
          </Field>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Dialog</h2>
        <Dialog
          trigger={<Button variant="secondary">Open dialog</Button>}
          title="Confirm preference"
          description="High-impact actions always ask before changing account or money state."
        >
          <p className="text-sm text-[var(--travel-color-ink-soft)]">
            This dialog uses Radix primitives for focus trap, Escape-to-close and labelled content.
          </p>
        </Dialog>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Loading skeletons</h2>
        <div className="grid gap-3 sm:grid-cols-3">
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Empty & error</h2>
        <div className="grid gap-4 lg:grid-cols-2">
          <EmptyState
            title="Nothing matched"
            description="Try a broader destination or different dates."
            actionLabel="Clear filters"
            onAction={() => undefined}
          />
          {errorVisible ? (
            <ErrorState
              message="A provider adapter timed out. Your search was not charged."
              onRetry={() => setErrorVisible(false)}
            />
          ) : (
            <EmptyState title="Recovered" description="Retry cleared the error state." />
          )}
        </div>
      </section>
    </div>
  );
}
