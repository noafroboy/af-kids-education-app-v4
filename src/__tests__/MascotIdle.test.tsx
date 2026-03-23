import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MascotIdle } from '@/components/ui/MascotIdle';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { animate?: unknown; transition?: unknown; whileTap?: unknown; initial?: unknown }) =>
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>,
    rect: ({ ...props }: React.SVGProps<SVGRectElement> & { animate?: unknown; transition?: unknown }) =>
      <rect {...(props as React.SVGProps<SVGRectElement>)} />,
    button: ({ children, ...props }: React.HTMLAttributes<HTMLButtonElement> & { whileTap?: unknown; initial?: unknown; animate?: unknown; transition?: unknown }) =>
      <button {...(props as React.HTMLAttributes<HTMLButtonElement>)}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('MascotIdle', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  it('renders with data-testid mascot-idle', () => {
    render(<MascotIdle />);
    expect(screen.getByTestId('mascot-idle')).toBeInTheDocument();
  });

  it('renders SVG panda', () => {
    const { container } = render(<MascotIdle />);
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('renders at default size md (96px)', () => {
    render(<MascotIdle size="md" />);
    const root = screen.getByTestId('mascot-idle');
    expect(root).toHaveStyle({ width: '96px', height: '96px' });
  });

  it('renders at sm size (56px)', () => {
    render(<MascotIdle size="sm" />);
    const root = screen.getByTestId('mascot-idle');
    expect(root).toHaveStyle({ width: '56px', height: '56px' });
  });

  it('renders at lg size (140px)', () => {
    render(<MascotIdle size="lg" />);
    const root = screen.getByTestId('mascot-idle');
    expect(root).toHaveStyle({ width: '140px', height: '140px' });
  });

  it('shows speech bubble when showBubble=true', () => {
    render(<MascotIdle showBubble={true} />);
    expect(screen.getByText(/Tap me!/)).toBeInTheDocument();
  });

  it('hides speech bubble when showBubble=false', () => {
    render(<MascotIdle showBubble={false} />);
    expect(screen.queryByText(/Tap me!/)).not.toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const onClick = jest.fn();
    render(<MascotIdle onClick={onClick} />);
    fireEvent.click(screen.getByTestId('mascot-idle'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});
