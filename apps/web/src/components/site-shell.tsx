'use client';

import { Button } from '@travel/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const links = [
  { href: '/search', label: 'Stays' },
  { href: '/destinations', label: 'Explore' },
  { href: '/trips', label: 'Trips' },
  { href: '/concierge', label: 'Concierge' },
];

export function SiteShell({ children, signedIn }: { children: ReactNode; signedIn: boolean }) {
  const pathname = usePathname();
  const navItems = [
    { href: '/', label: 'Home', current: pathname === '/' },
    ...links.map((item) => ({
      ...item,
      current: pathname === item.href || pathname.startsWith(`${item.href}/`),
    })),
  ];

  return (
    <div className="travel-ui flex min-h-screen flex-col">
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--travel-radius-md)] focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-[var(--travel-color-border)]/50 bg-[rgb(246_245_242_/0.88)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[var(--travel-nav-height)] max-w-[var(--travel-shell-max)] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-8">
            <Link
              href="/"
              className="font-[family-name:var(--travel-font-display)] text-lg font-bold tracking-tight text-[var(--travel-color-ink)] no-underline sm:text-xl"
            >
              Aotearoa Trails
            </Link>
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-0.5">
                {navItems
                  .filter((item) => item.href !== '/')
                  .map((item) => (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        aria-current={item.current ? 'page' : undefined}
                        className={`rounded-full px-3.5 py-2 text-sm font-medium no-underline transition-colors ${
                          item.current
                            ? 'bg-[var(--travel-color-ocean-soft)] text-[var(--travel-color-ocean-strong)]'
                            : 'text-[var(--travel-color-ink-soft)] hover:text-[var(--travel-color-ink)]'
                        }`}
                      >
                        {item.label}
                      </Link>
                    </li>
                  ))}
              </ul>
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {signedIn ? (
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/account">Profile</Link>
              </Button>
            ) : (
              <Button asChild variant="ghost" className="hidden sm:inline-flex">
                <Link href="/sign-in">Sign in</Link>
              </Button>
            )}
            <Button asChild>
              <Link href="/concierge">Plan my trip</Link>
            </Button>
          </div>
        </div>
        <nav
          aria-label="Primary mobile"
          className="border-t border-[var(--travel-color-border)]/50 lg:hidden"
        >
          <ul className="mx-auto flex max-w-[var(--travel-shell-max)] gap-1 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems
              .filter((item) => item.href !== '/')
              .map((item) => (
                <li key={item.href} className="shrink-0">
                  <Link
                    href={item.href}
                    aria-current={item.current ? 'page' : undefined}
                    className={`block min-h-11 rounded-full px-3.5 py-2.5 text-sm font-medium no-underline ${
                      item.current
                        ? 'bg-[var(--travel-color-ocean-soft)] text-[var(--travel-color-ocean-strong)]'
                        : 'text-[var(--travel-color-ink-soft)]'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
          </ul>
        </nav>
      </header>

      <main id="main-content" className="flex-1">
        {children}
      </main>

      <footer className="border-t border-[var(--travel-color-border)]/60 bg-[rgb(255_255_255_/0.5)]">
        <div className="mx-auto grid max-w-[var(--travel-shell-max)] gap-8 px-4 py-12 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr]">
          <div>
            <p className="font-[family-name:var(--travel-font-display)] text-xl font-bold tracking-tight">
              Aotearoa Trails
            </p>
            <p className="mt-3 max-w-sm text-sm text-[var(--travel-color-ink-soft)]">
              New Zealand, planned around you — stays, journeys and a personal travel concierge in
              one calm place.
            </p>
          </div>
          <div>
            <p className="travel-caption">Explore</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--travel-color-ink-soft)]">
              <li>
                <Link
                  href="/destinations"
                  className="no-underline hover:text-[var(--travel-color-ink)]"
                >
                  Destinations
                </Link>
              </li>
              <li>
                <Link href="/search" className="no-underline hover:text-[var(--travel-color-ink)]">
                  Stays
                </Link>
              </li>
              <li>
                <Link
                  href="/concierge"
                  className="no-underline hover:text-[var(--travel-color-ink)]"
                >
                  Concierge
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="travel-caption">Traveller care</p>
            <ul className="mt-3 space-y-2 text-sm text-[var(--travel-color-ink-soft)]">
              <li>
                <Link
                  href="/account/preferences"
                  className="no-underline hover:text-[var(--travel-color-ink)]"
                >
                  Communication preferences
                </Link>
              </li>
              <li>
                <Link href="/trips" className="no-underline hover:text-[var(--travel-color-ink)]">
                  My trips
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-[var(--travel-color-border)]/50">
          <div className="mx-auto flex max-w-[var(--travel-shell-max)] flex-col gap-2 px-4 py-5 text-sm text-[var(--travel-color-ink-muted)] sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <p>Crafted for travellers exploring Aotearoa.</p>
            <p>© {new Date().getFullYear()} Aotearoa Trails</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
