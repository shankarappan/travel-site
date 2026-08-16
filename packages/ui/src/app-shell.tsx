import type { ReactNode } from 'react';
import { cn } from './cn.js';

export interface NavItem {
  href: string;
  label: string;
  current?: boolean;
}

export interface AppShellProps {
  brand: ReactNode;
  navItems: NavItem[];
  actions?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export function AppShell({ brand, navItems, actions, children, footer, className }: AppShellProps) {
  return (
    <div className={cn('travel-ui', className)}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-[var(--travel-radius-md)] focus:bg-white focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      <header className="sticky top-0 z-40 border-b border-[var(--travel-color-border)]/50 bg-[rgb(246_245_242_/0.86)] backdrop-blur-xl">
        <div className="mx-auto flex min-h-[var(--travel-nav-height)] max-w-[var(--travel-shell-max)] items-center justify-between gap-4 px-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-8">
            <div className="shrink-0">{brand}</div>
            <nav aria-label="Primary" className="hidden lg:block">
              <ul className="flex items-center gap-0.5">
                {navItems.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      aria-current={item.current ? 'page' : undefined}
                      className={cn(
                        'rounded-full px-3.5 py-2 text-sm font-medium text-[var(--travel-color-ink-soft)] transition-colors duration-[var(--travel-motion-fast)] hover:text-[var(--travel-color-ink)]',
                        item.current &&
                          'bg-[var(--travel-color-ocean-soft)] text-[var(--travel-color-ocean-strong)]',
                      )}
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
        <nav
          aria-label="Primary mobile"
          className="border-t border-[var(--travel-color-border)]/50 lg:hidden"
        >
          <ul className="mx-auto flex max-w-[var(--travel-shell-max)] gap-1 overflow-x-auto px-3 py-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {navItems.map((item) => (
              <li key={item.href} className="shrink-0">
                <a
                  href={item.href}
                  aria-current={item.current ? 'page' : undefined}
                  className={cn(
                    'block min-h-11 rounded-full px-3.5 py-2.5 text-sm font-medium text-[var(--travel-color-ink-soft)]',
                    item.current &&
                      'bg-[var(--travel-color-ocean-soft)] text-[var(--travel-color-ocean-strong)]',
                  )}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <main id="main-content">{children}</main>
      {footer ? (
        <footer className="mt-auto border-t border-[var(--travel-color-border)]/60 bg-[rgb(255_255_255_/0.45)]">
          <div className="mx-auto max-w-[var(--travel-shell-max)] px-4 py-10 sm:px-6">{footer}</div>
        </footer>
      ) : null}
    </div>
  );
}
