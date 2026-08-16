import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

/**
 * Interactive container only — do not use as decorative chrome in heroes.
 */
export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  as?: 'div' | 'article' | 'section';
}

export function Card({ children, className, as: Comp = 'div', ...props }: CardProps) {
  return (
    <Comp
      className={cn(
        'rounded-[var(--travel-radius-lg)] border border-[var(--travel-color-border)] bg-[var(--travel-color-surface-elevated)] p-4 shadow-[var(--travel-elevation-1)]',
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
