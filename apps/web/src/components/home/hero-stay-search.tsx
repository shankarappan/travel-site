'use client';

import { Button, Field, Input } from '@travel/ui';
import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

function defaultCheckIn(): string {
  const date = new Date();
  date.setDate(date.getDate() + 21);
  return date.toISOString().slice(0, 10);
}

function defaultCheckOut(): string {
  const date = new Date();
  date.setDate(date.getDate() + 24);
  return date.toISOString().slice(0, 10);
}

export function HeroStaySearch({ className = '' }: { className?: string }) {
  const router = useRouter();
  const [destination, setDestination] = useState('Queenstown');
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [adults, setAdults] = useState('2');

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    const query = new URLSearchParams({
      destination,
      checkIn,
      checkOut,
      adults,
      children: '0',
      currency: 'NZD',
    });
    router.push(`/search?${query.toString()}`);
  }

  return (
    <form
      onSubmit={onSubmit}
      className={`grid gap-3 rounded-[var(--travel-radius-xl)] border border-white/25 bg-white/95 p-3 shadow-[var(--travel-elevation-3)] backdrop-blur-md sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_0.7fr_auto] lg:items-end ${className}`}
    >
      <Field id="hero-destination" label="Where to">
        <Input
          id="hero-destination"
          value={destination}
          onChange={(event) => setDestination(event.target.value)}
          placeholder="Queenstown, Rotorua…"
          required
        />
      </Field>
      <Field id="hero-checkin" label="Check-in">
        <Input
          id="hero-checkin"
          type="date"
          value={checkIn}
          onChange={(event) => setCheckIn(event.target.value)}
          required
        />
      </Field>
      <Field id="hero-checkout" label="Check-out">
        <Input
          id="hero-checkout"
          type="date"
          value={checkOut}
          onChange={(event) => setCheckOut(event.target.value)}
          required
        />
      </Field>
      <Field id="hero-adults" label="Travellers">
        <Input
          id="hero-adults"
          type="number"
          min={1}
          max={16}
          value={adults}
          onChange={(event) => setAdults(event.target.value)}
          required
        />
      </Field>
      <Button type="submit" className="min-h-11 w-full lg:mb-0.5">
        Search stays
      </Button>
    </form>
  );
}
