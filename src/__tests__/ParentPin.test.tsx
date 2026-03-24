import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import ParentPage from '@/app/parent/page';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial: _i, animate: _a, exit: _e, transition: _t, onClick, ...props }: React.HTMLAttributes<HTMLDivElement> & { initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown }) =>
      <div onClick={onClick} {...props}>{children}</div>,
    button: ({ children, whileTap: _wt, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileTap?: unknown }) =>
      <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockReplace = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ replace: mockReplace, push: jest.fn() }),
  usePathname: () => '/parent',
}));

jest.mock('next/link', () =>
  function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  }
);

const mockGetSetting = jest.fn().mockResolvedValue({ key: 'pinHash', value: 'stored-hash' });
const mockPutSetting = jest.fn().mockResolvedValue(undefined);
const mockClearProgress = jest.fn().mockResolvedValue(undefined);
const mockClearSessions = jest.fn().mockResolvedValue(undefined);

jest.mock('@/hooks/useDB', () => ({
  useDB: () => ({ _isMock: true }),
}));

jest.mock('@/lib/db', () => ({
  getSetting: (...args: unknown[]) => mockGetSetting(...args),
  putSetting: (...args: unknown[]) => mockPutSetting(...args),
  clearProgress: (...args: unknown[]) => mockClearProgress(...args),
  clearSessions: (...args: unknown[]) => mockClearSessions(...args),
}));

const mockVerifyPIN = jest.fn();
jest.mock('@/lib/crypto', () => ({
  verifyPIN: (...args: unknown[]) => mockVerifyPIN(...args),
}));

async function flushTimers() {
  await act(async () => { await new Promise((r) => setTimeout(r, 200)); });
}

describe('ParentPage (PIN entry)', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    sessionStorage.clear();
    mockGetSetting.mockResolvedValue({ key: 'pinHash', value: 'stored-hash' });
    mockVerifyPIN.mockResolvedValue(false);
  });

  it('renders data-testid parent-pin-page', async () => {
    render(<ParentPage />);
    await act(async () => {});
    expect(screen.getByTestId('parent-pin-page')).toBeInTheDocument();
  });

  it('shows bilingual header text', async () => {
    render(<ParentPage />);
    await act(async () => {});
    expect(screen.getByText(/Parent PIN/)).toBeInTheDocument();
    expect(screen.getByText(/家长密码/)).toBeInTheDocument();
  });

  it('navigates to /parent/dashboard on correct PIN', async () => {
    mockVerifyPIN.mockResolvedValue(true);
    render(<ParentPage />);

    // Wait for pinHash to load
    await waitFor(() => expect(mockGetSetting).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('pin-key-1'));
    fireEvent.click(screen.getByTestId('pin-key-2'));
    fireEvent.click(screen.getByTestId('pin-key-3'));
    fireEvent.click(screen.getByTestId('pin-key-4'));

    await flushTimers();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/parent/dashboard'));
  });

  it('shows wrong PIN error message after incorrect entry', async () => {
    mockVerifyPIN.mockResolvedValue(false);
    render(<ParentPage />);
    await waitFor(() => expect(mockGetSetting).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('pin-key-1'));
    fireEvent.click(screen.getByTestId('pin-key-2'));
    fireEvent.click(screen.getByTestId('pin-key-3'));
    fireEvent.click(screen.getByTestId('pin-key-4'));

    await flushTimers();
    await waitFor(() => expect(screen.getByText(/Wrong PIN/)).toBeInTheDocument());
  });

  it('shows (1/3) after first wrong attempt', async () => {
    mockVerifyPIN.mockResolvedValue(false);
    render(<ParentPage />);
    await waitFor(() => expect(mockGetSetting).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('pin-key-1'));
    fireEvent.click(screen.getByTestId('pin-key-2'));
    fireEvent.click(screen.getByTestId('pin-key-3'));
    fireEvent.click(screen.getByTestId('pin-key-4'));

    await flushTimers();
    await waitFor(() => expect(screen.getByText(/1\/3/)).toBeInTheDocument());
  });

  it('shows Forgot PIN button after 3 wrong attempts', async () => {
    mockVerifyPIN.mockResolvedValue(false);
    render(<ParentPage />);
    await waitFor(() => expect(mockGetSetting).toHaveBeenCalled());

    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByTestId('pin-key-1'));
      fireEvent.click(screen.getByTestId('pin-key-2'));
      fireEvent.click(screen.getByTestId('pin-key-3'));
      fireEvent.click(screen.getByTestId('pin-key-4'));
      await flushTimers();
    }

    await waitFor(() => expect(screen.getByText(/Forgot PIN/)).toBeInTheDocument());
  });

  it('shows reset modal when Forgot PIN clicked', async () => {
    mockVerifyPIN.mockResolvedValue(false);
    render(<ParentPage />);
    await waitFor(() => expect(mockGetSetting).toHaveBeenCalled());

    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByTestId('pin-key-1'));
      fireEvent.click(screen.getByTestId('pin-key-2'));
      fireEvent.click(screen.getByTestId('pin-key-3'));
      fireEvent.click(screen.getByTestId('pin-key-4'));
      await flushTimers();
    }

    await waitFor(() => screen.getByText(/Forgot PIN/));
    fireEvent.click(screen.getByText(/Forgot PIN/));

    await waitFor(() => expect(screen.getByText(/Reset all progress/)).toBeInTheDocument());
  });

  it('navigates to /onboarding and clears DB on reset confirm', async () => {
    mockVerifyPIN.mockResolvedValue(false);
    render(<ParentPage />);
    await waitFor(() => expect(mockGetSetting).toHaveBeenCalled());

    for (let i = 0; i < 3; i++) {
      fireEvent.click(screen.getByTestId('pin-key-1'));
      fireEvent.click(screen.getByTestId('pin-key-2'));
      fireEvent.click(screen.getByTestId('pin-key-3'));
      fireEvent.click(screen.getByTestId('pin-key-4'));
      await flushTimers();
    }

    await waitFor(() => screen.getByText(/Forgot PIN/));
    fireEvent.click(screen.getByText(/Forgot PIN/));
    await waitFor(() => screen.getByText(/Confirm Reset/));
    fireEvent.click(screen.getByText(/Confirm Reset/));

    await waitFor(() => {
      expect(mockClearProgress).toHaveBeenCalled();
      expect(mockClearSessions).toHaveBeenCalled();
      expect(mockReplace).toHaveBeenCalledWith('/onboarding');
    });
  });

  it('sets sessionStorage parentAuthed=1 on successful PIN entry', async () => {
    mockVerifyPIN.mockResolvedValue(true);
    render(<ParentPage />);
    await waitFor(() => expect(mockGetSetting).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('pin-key-1'));
    fireEvent.click(screen.getByTestId('pin-key-2'));
    fireEvent.click(screen.getByTestId('pin-key-3'));
    fireEvent.click(screen.getByTestId('pin-key-4'));

    await flushTimers();
    await waitFor(() => {
      expect(sessionStorage.getItem('parentAuthed')).toBe('1');
      expect(mockReplace).toHaveBeenCalledWith('/parent/dashboard');
    });
  });

  it('shows error when no PIN is set (pinHash is empty)', async () => {
    // Return empty pinHash and onboarding complete
    mockGetSetting.mockImplementation((_db: unknown, key: string) => {
      if (key === 'pinHash') return Promise.resolve({ key: 'pinHash', value: '' });
      if (key === 'onboardingComplete') return Promise.resolve({ key: 'onboardingComplete', value: 'true' });
      return Promise.resolve(undefined);
    });

    render(<ParentPage />);
    await waitFor(() => expect(mockGetSetting).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('pin-key-1'));
    fireEvent.click(screen.getByTestId('pin-key-2'));
    fireEvent.click(screen.getByTestId('pin-key-3'));
    fireEvent.click(screen.getByTestId('pin-key-4'));

    await flushTimers();
    await waitFor(() => expect(screen.getByText(/No PIN set/)).toBeInTheDocument());
  });

  it('redirects to /onboarding when no PIN set and onboarding not complete', async () => {
    mockGetSetting.mockImplementation((_db: unknown, key: string) => {
      if (key === 'pinHash') return Promise.resolve({ key: 'pinHash', value: '' });
      if (key === 'onboardingComplete') return Promise.resolve({ key: 'onboardingComplete', value: 'false' });
      return Promise.resolve(undefined);
    });

    render(<ParentPage />);
    await waitFor(() => expect(mockGetSetting).toHaveBeenCalled());

    fireEvent.click(screen.getByTestId('pin-key-1'));
    fireEvent.click(screen.getByTestId('pin-key-2'));
    fireEvent.click(screen.getByTestId('pin-key-3'));
    fireEvent.click(screen.getByTestId('pin-key-4'));

    await flushTimers();
    await waitFor(() => expect(mockReplace).toHaveBeenCalledWith('/onboarding'));
  });
});
