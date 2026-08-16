import { Button } from '@travel/ui';
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <>
      <section className="relative isolate min-h-[min(100svh,52rem)] overflow-hidden">
        <Image
          src="https://images.unsplash.com/photo-1469521669194-babb45599def?auto=format&fit=crop&w=2400&q=80"
          alt="Mist rising over a green New Zealand mountain valley"
          fill
          priority
          sizes="100vw"
          className="travel-animate-reveal object-cover"
        />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,rgb(11_46_38_/0.35)_0%,rgb(11_46_38_/0.55)_45%,rgb(11_46_38_/0.82)_100%)]"
        />
        <div className="relative mx-auto flex min-h-[min(100svh,52rem)] max-w-[var(--travel-shell-max)] flex-col justify-end px-4 pb-12 pt-28 sm:px-6 sm:pb-16">
          <div className="travel-animate-fade-up max-w-2xl text-white">
            <p className="font-[family-name:var(--travel-font-display)] text-4xl font-bold tracking-tight sm:text-6xl">
              Aotearoa Trails
            </p>
            <h1 className="mt-4 max-w-xl text-balance text-2xl font-medium leading-snug sm:text-3xl">
              Find your next New Zealand journey with clarity, not clutter.
            </h1>
            <p className="mt-3 max-w-lg text-base text-white/85 sm:text-lg">
              Discover destinations, sketch itineraries, and ask the concierge — without invented
              prices or hidden fees.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button
                asChild
                className="bg-white text-[var(--travel-color-ink)] hover:bg-[var(--travel-color-mist)]"
              >
                <Link href="/destinations">Explore destinations</Link>
              </Button>
              <Button
                asChild
                variant="secondary"
                className="border-white/40 bg-transparent text-white hover:border-white hover:bg-white/10"
              >
                <Link href="/trips">Start a trip</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-14 sm:px-6 sm:py-20">
        <h2 className="font-[family-name:var(--travel-font-display)] text-2xl font-semibold text-[var(--travel-color-ink)] sm:text-3xl">
          Built for the journey ahead
        </h2>
        <p className="mt-3 max-w-2xl text-[var(--travel-color-ink-soft)]">
          Conventional search and conversational help share one trusted backend. Live availability
          and bookings arrive only through verified provider tools.
        </p>
        <p className="mt-4">
          <Link
            href="/destinations"
            className="font-semibold text-[var(--travel-color-fern)] underline-offset-2 hover:underline"
          >
            Browse New Zealand destinations
          </Link>
        </p>
      </section>
    </>
  );
}
