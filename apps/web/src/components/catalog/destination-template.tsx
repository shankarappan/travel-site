import type { DestinationContent, GuideContent } from '@travel/api-contracts';
import Link from 'next/link';
import { ContentHero } from './content-hero';
import { MapHookPanel } from './map-hook-panel';

export function DestinationTemplate({
  destination,
  guides,
}: {
  destination: DestinationContent;
  guides: GuideContent[];
}) {
  return (
    <article>
      <ContentHero image={destination.hero} priority />
      <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-8 sm:px-6 sm:py-12">
        <p className="text-sm uppercase tracking-[0.14em] text-[var(--travel-color-ink-soft)]">
          {destination.region}
        </p>
        <h1 className="mt-2 font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)] sm:text-4xl">
          {destination.name}
        </h1>
        <p className="mt-3 max-w-2xl text-lg text-[var(--travel-color-ink-soft)]">
          {destination.summary}
        </p>

        <section className="mt-8">
          <h2 className="font-[family-name:var(--travel-font-display)] text-xl font-semibold">
            Highlights
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-[var(--travel-color-ink-soft)]">
            {destination.highlights.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section className="mt-8 max-w-3xl space-y-4 text-[var(--travel-color-ink-soft)]">
          {destination.body.map((paragraph) => (
            <p key={paragraph.slice(0, 24)}>{paragraph}</p>
          ))}
        </section>

        <div className="mt-10 grid gap-4 lg:grid-cols-2">
          <section className="rounded-[var(--travel-radius-lg)] bg-[var(--travel-color-surface-elevated)] p-5 shadow-[var(--travel-elevation-1)]">
            <h2 className="font-semibold text-[var(--travel-color-ink)]">Places to stay</h2>
            <p className="mt-2 text-sm text-[var(--travel-color-ink-soft)]">
              Explore stays nearby when you’re ready — totals and cancellation notes appear before
              you commit.
            </p>
            <Link
              href={`/search?destination=${encodeURIComponent(destination.name)}`}
              className="mt-3 inline-block text-sm font-semibold text-[var(--travel-color-ocean)] no-underline hover:underline"
            >
              Browse stays
            </Link>
          </section>
          <section className="rounded-[var(--travel-radius-lg)] bg-[var(--travel-color-surface-elevated)] p-5 shadow-[var(--travel-elevation-1)]">
            <h2 className="font-semibold text-[var(--travel-color-ink)]">Things to do</h2>
            <p className="mt-2 text-sm text-[var(--travel-color-ink-soft)]">
              Local experiences and day ideas will gather here as your journey takes shape.
            </p>
            <Link
              href={`/concierge?q=${encodeURIComponent(`What should I do in ${destination.name}?`)}`}
              className="mt-3 inline-block text-sm font-semibold text-[var(--travel-color-ocean)] no-underline hover:underline"
            >
              Ask the concierge
            </Link>
          </section>
        </div>

        <div className="mt-10">
          <MapHookPanel map={destination.map} />
        </div>

        {guides.length > 0 ? (
          <section className="mt-10">
            <h2 className="font-[family-name:var(--travel-font-display)] text-xl font-semibold">
              Guides
            </h2>
            <ul className="mt-3 space-y-2">
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="font-semibold text-[var(--travel-color-ocean)] no-underline hover:underline"
                  >
                    {guide.title}
                  </Link>
                  <p className="text-sm text-[var(--travel-color-ink-soft)]">{guide.dek}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </article>
  );
}
