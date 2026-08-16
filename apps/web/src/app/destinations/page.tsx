import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { catalogRepository } from '../../server/catalog/file-repository';

export const metadata: Metadata = {
  title: 'Destinations',
  description:
    'Curated New Zealand destinations with maps, highlights and honest inventory placeholders.',
};

export default async function DestinationsIndexPage() {
  const destinations = await catalogRepository.listDestinations();

  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-8 sm:px-6 sm:py-12">
      <h1 className="font-[family-name:var(--travel-font-display)] text-3xl font-semibold text-[var(--travel-color-ink)]">
        New Zealand destinations
      </h1>
      <p className="mt-3 max-w-2xl text-[var(--travel-color-ink-soft)]">
        CMS-backed templates for discovery. Live stay prices are never invented on these pages.
      </p>
      <ul className="mt-8 grid gap-6 sm:grid-cols-2">
        {destinations.map((destination) => (
          <li key={destination.slug}>
            <Link href={`/destinations/${destination.slug}`} className="group block no-underline">
              <div className="relative aspect-[16/10] overflow-hidden">
                <Image
                  src={destination.hero.src}
                  alt={destination.hero.alt}
                  fill
                  sizes="(max-width: 640px) 100vw, 50vw"
                  className="object-cover transition-transform duration-[var(--travel-motion-base)] group-hover:scale-[1.02]"
                />
              </div>
              <h2 className="mt-3 font-[family-name:var(--travel-font-display)] text-xl font-semibold text-[var(--travel-color-ink)]">
                {destination.name}
              </h2>
              <p className="mt-1 text-sm text-[var(--travel-color-ink-soft)]">
                {destination.region}
              </p>
              <p className="mt-2 text-sm text-[var(--travel-color-ink-soft)]">
                {destination.summary}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
