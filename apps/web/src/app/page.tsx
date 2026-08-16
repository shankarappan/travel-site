import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@travel/ui';
import { catalogRepository } from '../server/catalog/file-repository';
import { ConciergeStarters } from '../components/home/concierge-starters';
import { HeroStaySearch } from '../components/home/hero-stay-search';
import { InspirationSignup } from '../components/home/inspiration-signup';
import { DestinationTile } from '../components/catalog/destination-tile';
import { PropertyCard } from '../components/stays/property-card';

const journeys = [
  {
    title: 'Romantic escapes',
    detail: 'Lake light, quiet lodges, and evenings worth dressing for.',
    href: '/concierge?q=Find%20somewhere%20romantic%20near%20a%20lake.',
  },
  {
    title: 'Family adventures',
    detail: 'Easy bases, outdoor days, and stays that welcome everyone.',
    href: '/concierge?q=Where%20should%20we%20take%20the%20kids%20during%20the%20July%20school%20holidays%3F',
  },
  {
    title: 'South Island road trips',
    detail: 'Open roads, fjords, alpine towns, and unhurried itineraries.',
    href: '/concierge?q=Plan%20a%207-day%20South%20Island%20road%20trip%20for%20two.',
  },
  {
    title: 'Food & wine',
    detail: 'Cellar doors, waterfront dining, and regional flavours.',
    href: '/guides/queenstown-first-timer',
  },
  {
    title: 'Nature & wellness',
    detail: 'Forests, geothermal calm, and room to breathe.',
    href: '/destinations/rotorua',
  },
  {
    title: 'Weekend escapes',
    detail: 'Short stays with a big sense of place.',
    href: '/search?destination=Wellington',
  },
];

const stayStories = [
  {
    name: 'Lakeview Lodge',
    location: 'Queenstown · Wakatipu',
    blurb: 'Lake-facing calm after trail days — a sandbox stay for exploring booking flow.',
    href: '/search?destination=Queenstown',
    imageSrc:
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Modern lodge overlooking a calm lake at dusk',
    priceLabel: 'From search',
    meta: 'Demo stay',
  },
  {
    name: 'Fern Retreat',
    location: 'Rotorua · Lakes district',
    blurb: 'Garden quiet near geothermal landscapes — illustrative sandbox property.',
    href: '/search?destination=Rotorua',
    imageSrc:
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Boutique lodge exterior among trees',
    priceLabel: 'From search',
    meta: 'Demo stay',
  },
  {
    name: 'Harbour House',
    location: 'Wellington · City',
    blurb: 'Harbour energy with a soft landing for culture-filled weekends.',
    href: '/search?destination=Wellington',
    imageSrc:
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
    imageAlt: 'Bright apartment interior with city light',
    priceLabel: 'From search',
    meta: 'Demo stay',
  },
];

const inspiration = [
  {
    title: '7 unforgettable days through the South Island',
    href: '/concierge?q=Plan%20a%207-day%20South%20Island%20road%20trip%20for%20two.',
  },
  {
    title: 'The ultimate New Zealand honeymoon',
    href: '/concierge?q=Find%20somewhere%20romantic%20near%20a%20lake.',
  },
  {
    title: 'A food lover’s journey through Aotearoa',
    href: '/guides/queenstown-first-timer',
  },
  {
    title: 'Hidden places worth leaving the highway for',
    href: '/destinations/fiordland',
  },
];

export default async function HomePage() {
  const destinations = await catalogRepository.listDestinations();

  return (
    <>
      <section className="relative isolate min-h-[min(100svh,54rem)] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&w=2400&q=80"
          alt="Mist rising over a New Zealand mountain valley beside still water"
          fill
          priority
          sizes="100vw"
          className="travel-animate-reveal object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(12_22_24_/0.28)_0%,rgb(12_22_24_/0.45)_42%,rgb(12_22_24_/0.78)_100%)]"
        />
        <div className="relative mx-auto flex min-h-[min(100svh,54rem)] max-w-[var(--travel-shell-max)] flex-col justify-end gap-8 px-4 pb-10 pt-28 sm:px-6 sm:pb-14">
          <div className="travel-animate-fade-up max-w-3xl text-white">
            <p className="travel-caption text-white/70">Aotearoa Trails</p>
            <h1 className="travel-display mt-3 text-balance text-white">
              New Zealand, planned around you.
            </h1>
            <p className="travel-animate-fade-up travel-animate-delay-1 mt-4 max-w-xl text-base text-white/88 sm:text-lg">
              Discover extraordinary stays, unforgettable experiences and personalised journeys
              across Aotearoa — with a concierge when you want guidance, and clear search when you
              don’t.
            </p>
          </div>
          <div className="travel-animate-fade-up travel-animate-delay-2">
            <HeroStaySearch />
          </div>
        </div>
      </section>

      <section className="border-b border-[var(--travel-color-border)]/60 bg-[rgb(255_255_255_/0.55)]">
        <div className="mx-auto grid max-w-[var(--travel-shell-max)] gap-8 px-4 py-12 sm:px-6 lg:grid-cols-[1fr_1.1fr] lg:items-center lg:py-16">
          <div>
            <p className="travel-caption">Personal concierge</p>
            <h2 className="travel-h2 mt-3 text-[var(--travel-color-ink)]">
              Tell us how you want to feel — we’ll help shape the journey.
            </h2>
          </div>
          <ConciergeStarters />
        </div>
      </section>

      <section className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="travel-caption">Explore New Zealand</p>
            <h2 className="travel-h2 mt-2 text-[var(--travel-color-ink)]">
              Places that stay with you
            </h2>
          </div>
          <Button asChild variant="ghost">
            <Link href="/destinations">View all destinations</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
      </section>

      <section className="bg-[var(--travel-color-ocean-strong)] text-white">
        <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-14 sm:px-6 sm:py-20">
          <p className="travel-caption text-white/65">Find your kind of journey</p>
          <h2 className="travel-h2 mt-2 text-white">Travel with intention</h2>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {journeys.map((journey) => (
              <li key={journey.title}>
                <Link
                  href={journey.href}
                  className="block h-full rounded-[var(--travel-radius-lg)] border border-white/15 bg-white/5 p-5 no-underline transition-colors hover:bg-white/10"
                >
                  <h3 className="text-lg font-semibold text-white">{journey.title}</h3>
                  <p className="mt-2 text-sm text-white/75">{journey.detail}</p>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-14 sm:px-6 sm:py-20">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="travel-caption">Exceptional places to stay</p>
            <h2 className="travel-h2 mt-2 text-[var(--travel-color-ink)]">
              Sleep somewhere memorable
            </h2>
            <p className="mt-2 max-w-xl text-sm text-[var(--travel-color-ink-soft)]">
              Sample stays for exploring the booking experience. Live commercial inventory is not
              connected yet.
            </p>
          </div>
          <Button asChild variant="secondary">
            <Link href="/search">Browse stays</Link>
          </Button>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {stayStories.map((stay) => (
            <PropertyCard key={stay.name} {...stay} />
          ))}
        </div>
      </section>

      <section className="relative isolate overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1507692049790-de58290a4334?auto=format&fit=crop&w=2000&q=80"
          alt="Sunlit New Zealand coastline with turquoise water"
          fill
          sizes="100vw"
          className="object-cover"
        />
        <div aria-hidden className="absolute inset-0 bg-[rgb(12_22_24_/0.62)]" />
        <div className="relative mx-auto max-w-[var(--travel-shell-max)] px-4 py-16 sm:px-6 sm:py-24">
          <p className="travel-caption text-white/70">AI travel concierge</p>
          <h2 className="travel-h2 mt-3 max-w-2xl text-white">
            A knowledgeable companion for the whole journey — not another chatbot.
          </h2>
          <div className="mt-8 max-w-2xl">
            <ConciergeStarters variant="dark" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-14 sm:px-6 sm:py-20">
        <p className="travel-caption">Journey inspiration</p>
        <h2 className="travel-h2 mt-2 text-[var(--travel-color-ink)]">
          Stories to spark the next trip
        </h2>
        <ul className="mt-8 divide-y divide-[var(--travel-color-border)] border-y border-[var(--travel-color-border)]">
          {inspiration.map((item) => (
            <li key={item.title}>
              <Link
                href={item.href}
                className="flex items-center justify-between gap-4 py-5 no-underline transition-colors hover:text-[var(--travel-color-ocean)]"
              >
                <span className="text-lg font-medium text-[var(--travel-color-ink)]">
                  {item.title}
                </span>
                <span aria-hidden className="text-[var(--travel-color-ink-muted)]">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="border-y border-[var(--travel-color-border)]/70 bg-[rgb(255_255_255_/0.6)]">
        <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-14 sm:px-6 sm:py-20">
          <p className="travel-caption">Why travel with us</p>
          <h2 className="travel-h2 mt-2 max-w-2xl text-[var(--travel-color-ink)]">
            Designed for clarity when it matters most
          </h2>
          <ul className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: 'Personalised recommendations',
                body: 'Guidance shaped around your dates, pace and the way you like to travel.',
              },
              {
                title: 'Trusted travel options',
                body: 'Clear pricing and cancellation details before you commit — no invented urgency.',
              },
              {
                title: 'Simple trip management',
                body: 'Keep stays, notes and plans together as your journey takes shape.',
              },
              {
                title: 'Intelligent assistance',
                body: 'Ask your concierge when you want ideas — or browse on your own terms.',
              },
              {
                title: 'Support along the way',
                body: 'One place for preferences, trips and help before and during travel.',
              },
              {
                title: 'Built for Aotearoa first',
                body: 'New Zealand destinations and journeys at the heart of the experience.',
              },
            ].map((item) => (
              <li key={item.title} className="space-y-2">
                <h3 className="text-lg font-semibold text-[var(--travel-color-ink)]">
                  {item.title}
                </h3>
                <p className="text-sm text-[var(--travel-color-ink-soft)]">{item.body}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-14 sm:px-6 sm:py-20">
        <div className="grid gap-8 rounded-[var(--travel-radius-xl)] bg-[var(--travel-color-ocean-soft)] px-6 py-10 sm:grid-cols-[1.2fr_1fr] sm:px-10">
          <div>
            <p className="travel-caption">Travel inspiration</p>
            <h2 className="travel-h2 mt-2 text-[var(--travel-color-ink)]">
              Ideas worth opening on a quiet evening
            </h2>
            <p className="mt-3 text-sm text-[var(--travel-color-ink-soft)]">
              Occasional journey notes and useful offers — only with your consent. Manage anytime in
              preferences.
            </p>
          </div>
          <InspirationSignup />
        </div>
      </section>
    </>
  );
}
