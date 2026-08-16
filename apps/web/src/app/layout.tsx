import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aotearoa Trails',
  description: 'Discover New Zealand with an intelligent travel platform.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-NZ">
      <body>{children}</body>
    </html>
  );
}
