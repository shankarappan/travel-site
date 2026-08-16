import type { InputHTMLAttributes } from 'react';
import { cn } from './cn.js';

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        'w-full rounded-[var(--travel-radius-md)] border border-[var(--travel-color-border)] bg-[var(--travel-color-surface-elevated)] px-3 py-2.5 text-sm text-[var(--travel-color-ink)] placeholder:text-[var(--travel-color-ink-soft)]/60',
        className,
      )}
      {...props}
    />
  );
}
