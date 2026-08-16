import { Slot } from '@radix-ui/react-slot';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { cn } from './cn.js';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  asChild?: boolean;
  children: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary:
    'travel-btn-primary bg-[var(--travel-color-fern)] text-white hover:bg-[var(--travel-color-fern-strong)]',
  secondary:
    'bg-[var(--travel-color-surface-elevated)] text-[var(--travel-color-ink)] border border-[var(--travel-color-border)] hover:border-[var(--travel-color-fern)]',
  ghost:
    'bg-transparent text-[var(--travel-color-ink)] hover:bg-[var(--travel-color-glacier-soft)]',
  danger: 'bg-[var(--travel-color-danger)] text-white hover:opacity-90',
};

export function Button({
  variant = 'primary',
  asChild = false,
  className,
  type = 'button',
  children,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';
  return (
    <Comp
      type={asChild ? undefined : type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-[var(--travel-radius-md)] px-4 py-2.5 text-sm font-semibold transition-[background-color,border-color,transform] duration-[var(--travel-motion-fast)] ease-[var(--travel-ease)] disabled:cursor-not-allowed disabled:opacity-50',
        variantClass[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Comp>
  );
}
