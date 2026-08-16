'use client';

import { AppShell, Button } from '@travel/ui';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

const links = [
  { href: '/', label: 'Discover' },
  { href: '/search', label: 'Stays' },
  { href: '/trips', label: 'Trips' },
  { href: '/design-system', label: 'Design system' },
];

export function SiteShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const navItems = links.map((item) => ({
    ...item,
    current: item.href === '/' ? pathname === '/' : pathname.startsWith(item.href),
  }));

  return (
    <AppShell
      brand={
        <Link
          href="/"
          className="font-[family-name:var(--travel-font-display)] text-lg font-bold tracking-tight text-[var(--travel-color-ink)] no-underline"
        >
          Aotearoa Trails
        </Link>
      }
      navItems={navItems}
      actions={
        <>
          <Button variant="ghost" className="hidden sm:inline-flex">
            Sign in
          </Button>
          <Button asChild>
            <Link href="/trips">Plan a trip</Link>
          </Button>
        </>
      }
      footer={
        <div className="flex flex-col gap-2 text-sm text-[var(--travel-color-ink-soft)] sm:flex-row sm:items-center sm:justify-between">
          <p>Built for New Zealand discovery first. Prices and bookings stay server-verified.</p>
          <p>© {new Date().getFullYear()} Aotearoa Trails</p>
        </div>
      }
    >
      {children}
    </AppShell>
  );
}
