import { Bricolage_Grotesque, Figtree } from 'next/font/google';
import type { Metadata, Viewport } from 'next';
import type { CSSProperties, ReactNode } from 'react';
import { SiteShell } from '../components/site-shell';
import { auth } from '../server/identity/auth';
import './globals.css';

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const body = Figtree({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Aotearoa Trails',
    template: '%s · Aotearoa Trails',
  },
  description: 'Discover New Zealand with an intelligent travel platform.',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0b2e26',
};

export default async function RootLayout({ children }: { children: ReactNode }) {
  const session = await auth();
  const fontVars = {
    '--travel-font-display': 'var(--font-display), sans-serif',
    '--travel-font-body': 'var(--font-body), sans-serif',
  } as CSSProperties;

  return (
    <html lang="en-NZ" className={`${display.variable} ${body.variable}`}>
      <body style={fontVars}>
        <SiteShell signedIn={Boolean(session?.user)}>{children}</SiteShell>
      </body>
    </html>
  );
}
