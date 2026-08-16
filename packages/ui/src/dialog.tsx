'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import type { ReactNode } from 'react';
import { cn } from './cn.js';
import { Button } from './button.js';

export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  trigger: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

export function Dialog({
  open,
  onOpenChange,
  trigger,
  title,
  description,
  children,
  className,
}: DialogProps) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-40 bg-[rgb(11_46_38_/0.45)] data-[state=open]:animate-[travel-fade-up_var(--travel-motion-base)_var(--travel-ease)]" />
        <DialogPrimitive.Content
          className={cn(
            'fixed left-1/2 top-1/2 z-50 w-[min(92vw,28rem)] -translate-x-1/2 -translate-y-1/2 rounded-[var(--travel-radius-lg)] border border-[var(--travel-color-border)] bg-[var(--travel-color-surface-elevated)] p-5 shadow-[var(--travel-elevation-2)]',
            className,
          )}
        >
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <DialogPrimitive.Title className="font-[family-name:var(--travel-font-display)] text-lg font-semibold text-[var(--travel-color-ink)]">
                {title}
              </DialogPrimitive.Title>
              {description ? (
                <DialogPrimitive.Description className="mt-1 text-sm text-[var(--travel-color-ink-soft)]">
                  {description}
                </DialogPrimitive.Description>
              ) : null}
            </div>
            <DialogPrimitive.Close asChild>
              <Button variant="ghost" aria-label="Close dialog">
                Close
              </Button>
            </DialogPrimitive.Close>
          </div>
          {children}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
