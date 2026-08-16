import type { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@travel/ui';
import { catalogRepository } from '../../server/catalog/file-repository';
import { DestinationTile } from '../../components/catalog/destination-tile';

export const metadata: Metadata = {
  title: 'Explore',
  description: 'Discover New Zealand destinations worth planning a journey around.',
};

export default async function DestinationsIndexPage() {
  const destinations = await catalogRepository.listDestinations();

  return (
    <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-10 sm:px-6 sm:py-14">
      <p className="travel-caption">Explore</p>
      <h1 className="travel-h1 mt-2 text-[var(--travel-color-ink)]">New Zealand destinations</h1>
      <p className="mt-3 max-w-2xl text-[var(--travel-color-ink-soft)]">
        From alpine lakes to harbour cities — start with a place that feels right, then build the
        days around it.
      </p>
      <div className="mt-4">
        <Button asChild variant="secondary">
          <Link href="/concierge">Not sure where? Ask the concierge</Link>
        </Button>
      </div>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {destinations.map((destination) => (
          <DestinationTile
            key={destination.slug}
            href={`/destinations/${destination.slug}`}
            name={destination.name}
            region={destination.region}
            summary={destination.summary}
            imageSrc={destination.hero.src}
            imageAlt={destination.hero.alt}
          />
        ))}
      </div>
    </div>
  );
}
