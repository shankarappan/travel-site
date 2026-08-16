import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import './globals.css';

export const metadata: Metadata = {
  title: 'Aotearoa Trails Admin',
  description: 'Operations console for the travel platform.',
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en-NZ">
      <body>{children}</body>
    </html>
  );
}
