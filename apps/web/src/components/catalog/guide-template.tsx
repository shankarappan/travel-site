import type { GuideContent } from '@travel/api-contracts';
import Link from 'next/link';
import { ContentHero } from './content-hero';

export function GuideTemplate({ guide }: { guide: GuideContent }) {
  return (
    <article>
      <ContentHero image={guide.hero} priority />
      <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm text-[var(--travel-color-ink-soft)]">
          <Link
            href={`/destinations/${guide.destinationSlug}`}
            className="font-semibold text-[var(--travel-color-fern)] underline-offset-2 hover:underline"
          >
            Back to destination
          </Link>
        </p>
        <h1 className="mt-3 font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)] sm:text-4xl">
          {guide.title}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--travel-color-ink-soft)]">{guide.dek}</p>
        <div className="mt-8 max-w-3xl space-y-4 text-[var(--travel-color-ink-soft)]">
          {guide.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </div>
      </div>
    </article>
  );
}
