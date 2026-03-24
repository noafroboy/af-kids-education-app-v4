import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChangePinSection } from '@/components/parent/ChangePinSection';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, animate: _a, transition: _t, ...props }: React.HTMLAttributes<HTMLDivElement> & { animate?: unknown; transition?: unknown }) =>
      <div {...props}>{children}</div>,
    button: ({ children, whileTap: _wt, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileTap?: unknown }) =>
      <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockGetSetting = jest.fn();
const mockPutSetting = jest.fn();

jest.mock('@/hooks/useDB', () => ({
  useDB: () => ({ _isMock: true }),
}));

jest.mock('@/lib/db', () => ({
  getSetting: (...args: unknown[]) => mockGetSetting(...args),
  putSetting: (...args: unknown[]) => mockPutSetting(...args),
}));

const mockVerifyPIN = jest.fn();
const mockHashPIN = jest.fn();

jest.mock('@/lib/crypto', () => ({
  verifyPIN: (...args: unknown[]) => mockVerifyPIN(...args),
  hashPIN: (...args: unknown[]) => mockHashPIN(...args),
}));

describe('ChangePinSection error feedback', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSetting.mockResolvedValue({ key: 'pinHash', value: 'stored-hash' });
    mockVerifyPIN.mockResolvedValue(true);
    mockHashPIN.mockResolvedValue('new-hash');
    mockPutSetting.mockResolvedValue(undefined);
  });

  it('renders the verify step initially', () => {
    render(<ChangePinSection />);
    expect(screen.getByText(/Enter current PIN/)).toBeInTheDocument();
  });

  it('shows error message when saving new PIN fails', async () => {
    mockPutSetting.mockRejectedValue(new Error('IndexedDB write failed'));

    render(<ChangePinSection />);

    // Step 1: verify current PIN (passes)
    fireEvent.click(screen.getByTestId('pin-key-1'));
    fireEvent.click(screen.getByTestId('pin-key-2'));
    fireEvent.click(screen.getByTestId('pin-key-3'));
    fireEvent.click(screen.getByTestId('pin-key-4'));

    await waitFor(() => expect(screen.getByText(/Enter new PIN/)).toBeInTheDocument());

    // Step 2: enter new PIN (fails to save)
    fireEvent.click(screen.getByTestId('pin-key-5'));
    fireEvent.click(screen.getByTestId('pin-key-6'));
    fireEvent.click(screen.getByTestId('pin-key-7'));
    fireEvent.click(screen.getByTestId('pin-key-8'));

    await waitFor(() => expect(screen.getByText(/Failed to save new PIN/)).toBeInTheDocument());
  });

  it('shows PIN Changed success when saving succeeds', async () => {
    render(<ChangePinSection />);

    // Step 1: verify current PIN
    fireEvent.click(screen.getByTestId('pin-key-1'));
    fireEvent.click(screen.getByTestId('pin-key-2'));
    fireEvent.click(screen.getByTestId('pin-key-3'));
    fireEvent.click(screen.getByTestId('pin-key-4'));

    await waitFor(() => expect(screen.getByText(/Enter new PIN/)).toBeInTheDocument());

    // Step 2: enter new PIN (succeeds)
    fireEvent.click(screen.getByTestId('pin-key-5'));
    fireEvent.click(screen.getByTestId('pin-key-6'));
    fireEvent.click(screen.getByTestId('pin-key-7'));
    fireEvent.click(screen.getByTestId('pin-key-8'));

    await waitFor(() => expect(screen.getByText(/PIN Changed/)).toBeInTheDocument());
  });
});
