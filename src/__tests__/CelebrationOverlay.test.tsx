import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CelebrationOverlay } from '@/components/ui/CelebrationOverlay';

// Mock canvas-confetti
jest.mock('canvas-confetti', () => jest.fn());

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
  },
}));

// Mock useRouter
const mockPush = jest.fn();
const mockBack = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: mockBack }),
}));

describe('CelebrationOverlay', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders with data-testid celebration-overlay', () => {
    render(<CelebrationOverlay childName="小明" wordCount={6} />);
    expect(screen.getByTestId('celebration-overlay')).toBeInTheDocument();
  });

  it('shows child name and word count', () => {
    render(<CelebrationOverlay childName="小明" wordCount={6} />);
    expect(screen.getByText(/小明.*learned.*6.*words/i)).toBeInTheDocument();
  });

  it('calls onPlayMore when Play More clicked', () => {
    const onPlayMore = jest.fn();
    render(<CelebrationOverlay childName="小明" wordCount={6} onPlayMore={onPlayMore} />);
    fireEvent.click(screen.getByText(/Play More/i));
    expect(onPlayMore).toHaveBeenCalledTimes(1);
  });

  it('navigates home when Go Home clicked', () => {
    render(<CelebrationOverlay childName="小明" wordCount={6} />);
    fireEvent.click(screen.getByText(/Go Home/i));
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('fires confetti on mount', () => {
    const confetti = jest.requireMock('canvas-confetti');
    render(<CelebrationOverlay childName="小明" wordCount={3} />);
    expect(confetti).toHaveBeenCalled();
  });
});
