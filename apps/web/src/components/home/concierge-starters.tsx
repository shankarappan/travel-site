'use client';

import { Button } from '@travel/ui';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const starters = [
  'Plan a 7-day South Island road trip for two.',
  'Find a luxury Queenstown weekend under NZ$3,000.',
  'Where should we take the kids during the July school holidays?',
  'I have ten days in New Zealand. What shouldn’t I miss?',
  'Find somewhere romantic near a lake.',
];

export function ConciergeStarters({ variant = 'light' }: { variant?: 'light' | 'dark' }) {
  const router = useRouter();
  const muted = variant === 'dark' ? 'text-white/80' : 'text-[var(--travel-color-ink-soft)]';
  const chip =
    variant === 'dark'
      ? 'border-white/30 bg-white/10 text-white hover:bg-white/18'
      : 'border-[var(--travel-color-border)] bg-white text-[var(--travel-color-ink)] hover:border-[var(--travel-color-ocean)]';

  return (
    <div className="space-y-4">
      <p className={`text-sm ${muted}`}>
        Not sure where to start? Ask your personal travel concierge.
      </p>
      <div className="flex flex-wrap gap-2">
        {starters.map((prompt) => (
          <button
            key={prompt}
            type="button"
            className={`rounded-full border px-3.5 py-2 text-left text-sm transition-colors ${chip}`}
            onClick={() => {
              router.push(`/concierge?q=${encodeURIComponent(prompt)}`);
            }}
          >
            {prompt}
          </button>
        ))}
      </div>
      <Button asChild variant={variant === 'dark' ? 'secondary' : 'primary'}>
        <Link href="/concierge">Open concierge</Link>
      </Button>
    </div>
  );
}
