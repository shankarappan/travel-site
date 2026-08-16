import { cn } from './cn.js';
import { Button } from './button.js';

export interface ErrorStateProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({
  title = 'Something went wrong',
  message,
  onRetry,
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        'flex flex-col items-start gap-3 border border-[var(--travel-color-danger)]/30 bg-[var(--travel-color-danger-soft)] px-5 py-6',
        className,
      )}
    >
      <h2 className="font-[family-name:var(--travel-font-display)] text-xl font-semibold text-[var(--travel-color-danger)]">
        {title}
      </h2>
      <p className="text-sm text-[var(--travel-color-ink-soft)]">{message}</p>
      {onRetry ? (
        <Button type="button" variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      ) : null}
    </div>
  );
}
