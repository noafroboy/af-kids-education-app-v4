import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { CategorySelector, CategoryItem } from '@/components/CategorySelector';

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

const TEST_CATEGORIES: CategoryItem[] = [
  { category: 'animals', label: 'Animals', labelZh: '动物', emoji: '🐾', wordCount: 10 },
  { category: 'food', label: 'Food', labelZh: '食物', emoji: '🍎', wordCount: 8 },
];

describe('CategorySelector', () => {
  it('renders with data-testid category-selector', () => {
    render(<CategorySelector categories={TEST_CATEGORIES} onSelect={jest.fn()} />);
    expect(screen.getByTestId('category-selector')).toBeInTheDocument();
  });

  it('renders All Categories tile', () => {
    render(<CategorySelector categories={TEST_CATEGORIES} onSelect={jest.fn()} />);
    expect(screen.getByTestId('category-all')).toBeInTheDocument();
    expect(screen.getByText('All Categories')).toBeInTheDocument();
  });

  it('renders each category tile', () => {
    render(<CategorySelector categories={TEST_CATEGORIES} onSelect={jest.fn()} />);
    expect(screen.getByTestId('category-animals')).toBeInTheDocument();
    expect(screen.getByTestId('category-food')).toBeInTheDocument();
    expect(screen.getByText('Animals')).toBeInTheDocument();
    expect(screen.getByText('Food')).toBeInTheDocument();
  });

  it('shows emoji and word count badge', () => {
    render(<CategorySelector categories={TEST_CATEGORIES} onSelect={jest.fn()} />);
    expect(screen.getByText('10 words')).toBeInTheDocument();
    expect(screen.getByText('8 words')).toBeInTheDocument();
  });

  it("calls onSelect('all') when All tile is tapped", () => {
    const onSelect = jest.fn();
    render(<CategorySelector categories={TEST_CATEGORIES} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('category-all'));
    expect(onSelect).toHaveBeenCalledWith('all');
  });

  it('calls onSelect with category when category tile tapped', () => {
    const onSelect = jest.fn();
    render(<CategorySelector categories={TEST_CATEGORIES} onSelect={onSelect} />);
    fireEvent.click(screen.getByTestId('category-animals'));
    expect(onSelect).toHaveBeenCalledWith('animals');
  });

  it('renders empty categories list with only All tile', () => {
    render(<CategorySelector categories={[]} onSelect={jest.fn()} />);
    expect(screen.getByTestId('category-all')).toBeInTheDocument();
    expect(screen.queryByTestId('category-animals')).not.toBeInTheDocument();
  });
});
