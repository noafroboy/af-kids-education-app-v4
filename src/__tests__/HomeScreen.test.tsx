import React from 'react';
import { render, screen, act, waitFor } from '@testing-library/react';
import { HomeScreen } from '@/components/HomeScreen';

// Mock next/link
jest.mock('next/link', () => {
  return function MockLink({ href, children, ...props }: { href: string; children: React.ReactNode } & React.HTMLAttributes<HTMLAnchorElement>) {
    return <a href={href} {...props}>{children}</a>;
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileHover: _wh, ...props }: React.HTMLAttributes<HTMLDivElement> & { whileHover?: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock useDB
const mockDb = { name: 'test-db' };
jest.mock('@/hooks/useDB', () => ({
  useDB: () => mockDb,
}));

// Mock db functions
const mockGetSetting = jest.fn();
const mockGetAllSessions = jest.fn();
jest.mock('@/lib/db', () => ({
  getSetting: (...args: unknown[]) => mockGetSetting(...args),
  getAllSessions: (...args: unknown[]) => mockGetAllSessions(...args),
}));

function setupDefaultMocks(todaySessionWords = 5) {
  mockGetSetting.mockResolvedValue({ value: 'Alex' });
  const today = new Date().toISOString();
  mockGetAllSessions.mockResolvedValue([
    { completedAt: today, wordIds: Array(todaySessionWords).fill('w') },
  ]);
}

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches data on initial mount and displays word count', async () => {
    setupDefaultMocks(3);

    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText(/今日: 3个词/)).toBeInTheDocument();
    });
    expect(mockGetAllSessions).toHaveBeenCalledTimes(1);
  });

  it('re-fetches when visibilityState becomes visible', async () => {
    setupDefaultMocks(2);
    render(<HomeScreen />);

    // Wait for initial fetch
    await waitFor(() => {
      expect(screen.getByText(/今日: 2个词/)).toBeInTheDocument();
    });

    // Update mock to return updated count
    const today = new Date().toISOString();
    mockGetAllSessions.mockResolvedValue([
      { completedAt: today, wordIds: Array(7).fill('w') },
    ]);

    // Simulate tab becoming visible
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    await waitFor(() => {
      expect(screen.getByText(/今日: 7个词/)).toBeInTheDocument();
    });
    // Should have fetched at least twice (mount + visibility change)
    expect(mockGetAllSessions.mock.calls.length).toBeGreaterThanOrEqual(2);
  });

  it('does not re-fetch when visibilityState becomes hidden', async () => {
    setupDefaultMocks(4);
    render(<HomeScreen />);

    await waitFor(() => {
      expect(screen.getByText(/今日: 4个词/)).toBeInTheDocument();
    });

    const callsBefore = mockGetAllSessions.mock.calls.length;

    // Simulate tab becoming hidden
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'hidden',
    });
    await act(async () => {
      document.dispatchEvent(new Event('visibilitychange'));
    });

    // Give a tick for any unexpected async calls
    await new Promise((r) => setTimeout(r, 50));
    expect(mockGetAllSessions.mock.calls.length).toBe(callsBefore);
  });

  it('removes visibilitychange listener on unmount', async () => {
    setupDefaultMocks(1);
    const removeEventListenerSpy = jest.spyOn(document, 'removeEventListener');

    const { unmount } = render(<HomeScreen />);
    await waitFor(() => {
      expect(mockGetAllSessions).toHaveBeenCalled();
    });

    unmount();

    expect(removeEventListenerSpy).toHaveBeenCalledWith(
      'visibilitychange',
      expect.any(Function),
    );
    removeEventListenerSpy.mockRestore();
  });
});
