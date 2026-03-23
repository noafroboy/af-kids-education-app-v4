import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MoodCheck } from '@/components/MoodCheck';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({
      children,
      whileTap: _wt,
      ...props
    }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileTap?: unknown }) => (
      <button {...props}>{children}</button>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('MoodCheck', () => {
  it('renders with data-testid mood-check', () => {
    render(<MoodCheck onMoodSelected={jest.fn()} />);
    expect(screen.getByTestId('mood-check')).toBeInTheDocument();
  });

  it('renders bilingual heading', () => {
    render(<MoodCheck onMoodSelected={jest.fn()} />);
    expect(screen.getByText(/今天怎么样/)).toBeInTheDocument();
    expect(screen.getByText(/How are you feeling/)).toBeInTheDocument();
  });

  it('renders happy, okay, tired buttons', () => {
    render(<MoodCheck onMoodSelected={jest.fn()} />);
    expect(screen.getByTestId('mood-happy')).toBeInTheDocument();
    expect(screen.getByTestId('mood-okay')).toBeInTheDocument();
    expect(screen.getByTestId('mood-tired')).toBeInTheDocument();
  });

  it("calls onMoodSelected('happy') when happy tapped", () => {
    const onMoodSelected = jest.fn();
    render(<MoodCheck onMoodSelected={onMoodSelected} />);
    fireEvent.click(screen.getByTestId('mood-happy'));
    expect(onMoodSelected).toHaveBeenCalledWith('happy');
  });

  it("calls onMoodSelected('okay') when okay tapped", () => {
    const onMoodSelected = jest.fn();
    render(<MoodCheck onMoodSelected={onMoodSelected} />);
    fireEvent.click(screen.getByTestId('mood-okay'));
    expect(onMoodSelected).toHaveBeenCalledWith('okay');
  });

  it("calls onMoodSelected('tired') when tired tapped", () => {
    const onMoodSelected = jest.fn();
    render(<MoodCheck onMoodSelected={onMoodSelected} />);
    fireEvent.click(screen.getByTestId('mood-tired'));
    expect(onMoodSelected).toHaveBeenCalledWith('tired');
  });

  it('mood buttons have min-height/min-width >= 96px', () => {
    render(<MoodCheck onMoodSelected={jest.fn()} />);
    const btn = screen.getByTestId('mood-happy');
    expect(btn).toHaveStyle({ minWidth: '96px', minHeight: '96px' });
  });
});
