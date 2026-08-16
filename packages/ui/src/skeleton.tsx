import { cn } from './cn.js';

export interface SkeletonProps {
  className?: string;
  'aria-label'?: string;
}

export function Skeleton({ className, 'aria-label': ariaLabel = 'Loading' }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={ariaLabel}
      className={cn(
        'rounded-[var(--travel-radius-md)] bg-[linear-gradient(90deg,var(--travel-color-sand),var(--travel-color-mist),var(--travel-color-sand))] bg-[length:200%_100%] animate-[travel-shimmer_1.2s_linear_infinite]',
        className,
      )}
    />
  );
}
