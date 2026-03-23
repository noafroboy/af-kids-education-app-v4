import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { VocabularyCard } from '@/components/ui/VocabularyCard';
import type { VocabularyWord } from '@/types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileTap: _wt, ...props }: React.HTMLAttributes<HTMLDivElement> & { whileTap?: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
}));

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt, onError }: { src: string; alt: string; onError?: () => void }) {
    return <img src={src} alt={alt} onError={onError} />;
  };
});

// Mock useAudio
jest.mock('@/hooks/useAudio', () => ({
  useAudio: () => ({
    playWord: jest.fn(),
    playEffect: jest.fn(),
    isPlaying: false,
    audioError: false,
  }),
}));

const mockWord: VocabularyWord = {
  id: 'animal-cat',
  englishWord: 'Cat',
  mandarinWord: '猫',
  pinyin: 'māo',
  category: 'animals',
  imagePath: '/images/vocabulary/cat.png',
  audioEnPath: '/audio/en/cat.mp3',
  audioZhPath: '/audio/zh/mao.mp3',
  tags: ['pet'],
};

describe('VocabularyCard', () => {
  it('renders with data-testid vocab-card', () => {
    render(<VocabularyCard word={mockWord} />);
    expect(screen.getByTestId('vocab-card')).toBeInTheDocument();
  });

  it('shows english word', () => {
    render(<VocabularyCard word={mockWord} />);
    expect(screen.getByText('Cat')).toBeInTheDocument();
  });

  it('shows mandarin word', () => {
    render(<VocabularyCard word={mockWord} />);
    expect(screen.getByText('猫')).toBeInTheDocument();
  });

  it('shows pinyin', () => {
    render(<VocabularyCard word={mockWord} />);
    expect(screen.getByText('māo')).toBeInTheDocument();
  });

  it('calls onTap when clicked', () => {
    const onTap = jest.fn();
    render(<VocabularyCard word={mockWord} onTap={onTap} />);
    fireEvent.click(screen.getByTestId('vocab-card'));
    expect(onTap).toHaveBeenCalledTimes(1);
  });

  it('renders audio button', () => {
    render(<VocabularyCard word={mockWord} />);
    expect(screen.getByTestId('audio-button')).toBeInTheDocument();
  });

  it('falls back to placeholder on image error', () => {
    render(<VocabularyCard word={mockWord} />);
    const img = screen.getByAltText('Cat') as HTMLImageElement;
    fireEvent.error(img);
    expect(img.src).toContain('/images/placeholder.png');
  });
});
