import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ParentSettings from '@/app/parent/settings/page';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial: _i, animate: _a, exit: _e, transition: _t, onClick, ...props }: React.HTMLAttributes<HTMLDivElement> & { initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown }) =>
      <div onClick={onClick} {...props}>{children}</div>,
    button: ({ children, whileTap: _wt, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileTap?: unknown }) =>
      <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, replace: jest.fn() }),
  usePathname: () => '/parent/settings',
}));

jest.mock('next/link', () =>
  function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  }
);

const mockGetSetting = jest.fn();
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

// Mock ChangePinSection since it uses PinPad internally
jest.mock('@/components/parent/ChangePinSection', () => ({
  ChangePinSection: () => <div data-testid="change-pin-section">ChangePinSection</div>,
}));

describe('ParentSettings', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSetting.mockImplementation((_db: unknown, key: string) => {
      if (key === 'childName') return Promise.resolve({ key: 'childName', value: 'Lily' });
      if (key === 'childAge') return Promise.resolve({ key: 'childAge', value: 4 });
      return Promise.resolve(undefined);
    });
  });

  it('renders data-testid parent-settings', () => {
    render(<ParentSettings />);
    expect(screen.getByTestId('parent-settings')).toBeInTheDocument();
  });

  it('pre-fills child name from DB', async () => {
    render(<ParentSettings />);
    await waitFor(() => {
      const input = screen.getByPlaceholderText(/Child's name/i) as HTMLInputElement;
      expect(input.value).toBe('Lily');
    });
  });

  it('pre-selects age from DB', async () => {
    render(<ParentSettings />);
    await waitFor(() => {
      const ageBtn = screen.getByTestId('age-option-4');
      expect(ageBtn.className).toContain('bg-[#FF6B35]');
    });
  });

  it('saves profile when Save clicked', async () => {
    render(<ParentSettings />);
    await waitFor(() => screen.getByPlaceholderText(/Child's name/i));

    fireEvent.change(screen.getByPlaceholderText(/Child's name/i), { target: { value: 'Leo' } });
    fireEvent.click(screen.getByText(/Save \/ 保存/));

    await waitFor(() => expect(mockPutSetting).toHaveBeenCalledWith(expect.anything(), 'childName', 'Leo'));
  });

  it('shows saved confirmation after saving', async () => {
    render(<ParentSettings />);
    await waitFor(() => screen.getByPlaceholderText(/Child's name/i));

    fireEvent.click(screen.getByText(/Save \/ 保存/));
    await waitFor(() => expect(screen.getByText(/Saved/)).toBeInTheDocument());
  });

  it('renders ChangePinSection', () => {
    render(<ParentSettings />);
    expect(screen.getByTestId('change-pin-section')).toBeInTheDocument();
  });

  it('shows reset confirm dialog when reset button clicked', async () => {
    render(<ParentSettings />);
    fireEvent.click(screen.getByText(/Reset All Progress/));
    await waitFor(() => expect(screen.getByText(/Reset Progress\?/)).toBeInTheDocument());
  });

  it('clears DB and navigates to / on confirm reset', async () => {
    render(<ParentSettings />);
    fireEvent.click(screen.getByText(/Reset All Progress/));
    await waitFor(() => screen.getByText(/Confirm/));
    fireEvent.click(screen.getByText('确认 / Confirm'));

    await waitFor(() => {
      expect(mockClearProgress).toHaveBeenCalled();
      expect(mockClearSessions).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  it('closes reset dialog on Cancel', async () => {
    render(<ParentSettings />);
    fireEvent.click(screen.getByText(/Reset All Progress/));
    await waitFor(() => screen.getByText(/取消 \/ Cancel/));
    fireEvent.click(screen.getByText(/取消 \/ Cancel/));
    await waitFor(() => expect(screen.queryByText(/Reset Progress\?/)).not.toBeInTheDocument());
  });
});
