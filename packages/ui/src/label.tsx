import * as LabelPrimitive from '@radix-ui/react-label';
import type { ComponentPropsWithoutRef } from 'react';
import { cn } from './cn.js';

export type LabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

export function Label({ className, ...props }: LabelProps) {
  return (
    <LabelPrimitive.Root
      className={cn('text-sm font-medium text-[var(--travel-color-ink-soft)]', className)}
      {...props}
    />
  );
}
