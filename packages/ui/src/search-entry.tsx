'use client';

import type { FormEvent, ReactNode } from 'react';
import { cn } from './cn.js';
import { Button } from './button.js';
import { Field } from './field.js';
import { Input } from './input.js';

export interface SearchEntryProps {
  label?: string;
  placeholder?: string;
  defaultValue?: string;
  onSearch?: (query: string) => void;
  className?: string;
  trailing?: ReactNode;
}

export function SearchEntry({
  label = 'Search destinations',
  placeholder = 'Queenstown, Fiordland, Wellington…',
  defaultValue,
  onSearch,
  className,
  trailing,
}: SearchEntryProps) {
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    const query = String(data.get('q') ?? '').trim();
    onSearch?.(query);
  };

  return (
    <form
      role="search"
      onSubmit={handleSubmit}
      className={cn(
        'flex flex-col gap-3 rounded-[var(--travel-radius-lg)] border border-[var(--travel-color-border)] bg-[var(--travel-color-surface-elevated)] p-3 shadow-[var(--travel-elevation-1)] sm:flex-row sm:items-end',
        className,
      )}
    >
      <Field id="destination-search" label={label} className="flex-1">
        <Input
          id="destination-search"
          name="q"
          type="search"
          placeholder={placeholder}
          defaultValue={defaultValue}
          autoComplete="off"
          aria-describedby={undefined}
        />
      </Field>
      {trailing}
      <Button type="submit" className="sm:self-end">
        Search
      </Button>
    </form>
  );
}
