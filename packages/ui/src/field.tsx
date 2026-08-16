import type { ReactNode } from 'react';
import { cn } from './cn.js';
import { Label } from './label.js';

export interface FieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
  className?: string;
}

export function Field({ id, label, hint, error, children, className }: FieldProps) {
  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {children}
      {hint && !error ? (
        <p id={`${id}-hint`} className="text-xs text-[var(--travel-color-ink-soft)]">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} role="alert" className="text-xs text-[var(--travel-color-danger)]">
          {error}
        </p>
      ) : null}
    </div>
  );
}
