import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { Button } from './button.js';
import { EmptyState } from './empty-state.js';
import { ErrorState } from './error-state.js';
import { Skeleton } from './skeleton.js';

describe('ui primitives', () => {
  it('renders an accessible skeleton status', () => {
    const html = renderToStaticMarkup(<Skeleton className="h-4 w-24" />);
    expect(html).toContain('role="status"');
    expect(html).toContain('Loading');
  });

  it('renders empty and error messaging', () => {
    expect(
      renderToStaticMarkup(
        <EmptyState title="No trips" description="Save a destination to start planning." />,
      ),
    ).toContain('No trips');
    expect(renderToStaticMarkup(<ErrorState message="Provider timed out" />)).toContain(
      'Provider timed out',
    );
  });

  it('renders primary button text', () => {
    expect(renderToStaticMarkup(<Button>Continue</Button>)).toContain('Continue');
  });
});
