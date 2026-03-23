import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { PinPad } from '@/components/ui/PinPad';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement>) => <div {...props}>{children}</div>,
    button: ({ children, whileTap: _wt, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileTap?: unknown }) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('PinPad', () => {
  it('renders digit buttons 0-9', () => {
    const onSubmit = jest.fn();
    render(<PinPad onSubmit={onSubmit} />);

    for (let i = 0; i <= 9; i++) {
      expect(screen.getByTestId(`pin-key-${i}`)).toBeInTheDocument();
    }
  });

  it('calls onSubmit after 4 digits', async () => {
    const onSubmit = jest.fn();
    render(<PinPad onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('pin-key-1'));
    fireEvent.click(screen.getByTestId('pin-key-2'));
    fireEvent.click(screen.getByTestId('pin-key-3'));
    fireEvent.click(screen.getByTestId('pin-key-4'));

    await new Promise((r) => setTimeout(r, 200));
    expect(onSubmit).toHaveBeenCalledWith('1234');
  });

  it('backspace removes last digit', async () => {
    const onSubmit = jest.fn();
    render(<PinPad onSubmit={onSubmit} />);

    fireEvent.click(screen.getByTestId('pin-key-1'));
    fireEvent.click(screen.getByTestId('pin-key-2'));
    fireEvent.click(screen.getByTestId('pin-key-backspace'));
    fireEvent.click(screen.getByTestId('pin-key-3'));
    fireEvent.click(screen.getByTestId('pin-key-4'));
    fireEvent.click(screen.getByTestId('pin-key-5'));

    await new Promise((r) => setTimeout(r, 200));
    expect(onSubmit).toHaveBeenCalledWith('1345');
  });
});
