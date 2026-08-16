import type { ReactNode } from 'react';
import { cn } from './cn.js';
import { Button } from './button.js';

export interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  children?: ReactNode;
}

export function EmptyState({
  title,
  description,
  actionLabel,
  onAction,
  className,
  children,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-start gap-3 border border-dashed border-[var(--travel-color-border)] bg-[var(--travel-color-surface-elevated)]/70 px-5 py-6',
        className,
      )}
    >
      <h2 className="font-[family-name:var(--travel-font-display)] text-xl font-semibold text-[var(--travel-color-ink)]">
        {title}
      </h2>
      <p className="max-w-prose text-sm text-[var(--travel-color-ink-soft)]">{description}</p>
      {children}
      {actionLabel && onAction ? (
        <Button type="button" onClick={onAction}>
          {actionLabel}
        </Button>
      ) : null}
    </div>
  );
}
