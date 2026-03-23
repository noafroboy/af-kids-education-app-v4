import React from 'react';
import { render, screen } from '@testing-library/react';
import { ParentLayout } from '@/components/layouts/ParentLayout';

jest.mock('next/link', () =>
  function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) {
    return <a href={href} {...(props as React.AnchorHTMLAttributes<HTMLAnchorElement>)}>{children}</a>;
  }
);

describe('ParentLayout', () => {
  it('renders with data-testid parent-layout', () => {
    render(<ParentLayout><div>content</div></ParentLayout>);
    expect(screen.getByTestId('parent-layout')).toBeInTheDocument();
  });

  it('renders back-to-home link pointing to /', () => {
    render(<ParentLayout><div>content</div></ParentLayout>);
    const link = screen.getByRole('link', { name: /back to home/i });
    expect(link).toHaveAttribute('href', '/');
  });

  it('renders default bilingual title', () => {
    render(<ParentLayout><div>content</div></ParentLayout>);
    expect(screen.getByText(/Parent Area/)).toBeInTheDocument();
    expect(screen.getByText(/Parent Area/).textContent).toContain('家长区域');
  });

  it('renders custom title when provided', () => {
    render(<ParentLayout title="Settings / 设置"><div>content</div></ParentLayout>);
    expect(screen.getByText('Settings / 设置')).toBeInTheDocument();
  });

  it('renders rightSlot when provided', () => {
    render(
      <ParentLayout rightSlot={<button>Test Slot</button>}>
        <div>content</div>
      </ParentLayout>
    );
    expect(screen.getByRole('button', { name: 'Test Slot' })).toBeInTheDocument();
  });

  it('renders children', () => {
    render(<ParentLayout><div data-testid="child">child content</div></ParentLayout>);
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('has indigo header background', () => {
    render(<ParentLayout><div>content</div></ParentLayout>);
    const header = screen.getByRole('banner');
    expect(header.className).toContain('bg-[#4F46E5]');
  });
});
