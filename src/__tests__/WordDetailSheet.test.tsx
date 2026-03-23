import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { WordDetailSheet } from '@/components/ui/WordDetailSheet';
import type { VocabularyWord, WordProgress } from '@/types';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial: _i, animate: _a, exit: _e, transition: _t, onClick, ...props }: React.HTMLAttributes<HTMLDivElement> & { initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown }) =>
      <div onClick={onClick} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/image', () =>
  function MockImage({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} />;
  }
);

const mockPlayWordEn = jest.fn();
jest.mock('@/hooks/useAudio', () => ({
  useAudio: () => ({
    playWord: jest.fn(),
    playWordEn: mockPlayWordEn,
    playEffect: jest.fn(),
    isPlaying: false,
    audioError: false,
  }),
}));

const MOCK_WORD: VocabularyWord = {
  id: 'cat',
  englishWord: 'Cat',
  mandarinWord: '猫',
  pinyin: 'māo',
  category: 'animals',
  imagePath: '/images/cat.png',
  audioEnPath: '/audio/en/cat.mp3',
  audioZhPath: '/audio/zh/mao.mp3',
  tags: [],
};

const MOCK_PROGRESS: WordProgress = {
  wordId: 'cat',
  seenCount: 5,
  correctCount: 3,
  masteryLevel: 2,
  lastSeenAt: '2026-03-20T10:00:00Z',
};

describe('WordDetailSheet', () => {
  beforeEach(() => jest.clearAllMocks());

  it('renders with data-testid word-detail-sheet', () => {
    render(<WordDetailSheet word={MOCK_WORD} progress={null} onClose={jest.fn()} />);
    expect(screen.getByTestId('word-detail-sheet')).toBeInTheDocument();
  });

  it('displays English word', () => {
    render(<WordDetailSheet word={MOCK_WORD} progress={null} onClose={jest.fn()} />);
    expect(screen.getByText('Cat')).toBeInTheDocument();
  });

  it('displays Mandarin word', () => {
    render(<WordDetailSheet word={MOCK_WORD} progress={null} onClose={jest.fn()} />);
    expect(screen.getByText('猫')).toBeInTheDocument();
  });

  it('displays pinyin', () => {
    render(<WordDetailSheet word={MOCK_WORD} progress={null} onClose={jest.fn()} />);
    expect(screen.getByText('māo')).toBeInTheDocument();
  });

  it('calls onClose when close button clicked', () => {
    const onClose = jest.fn();
    render(<WordDetailSheet word={MOCK_WORD} progress={null} onClose={onClose} />);
    fireEvent.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when backdrop clicked', () => {
    const onClose = jest.fn();
    render(<WordDetailSheet word={MOCK_WORD} progress={null} onClose={onClose} />);
    // The first motion.div (backdrop) has onClick={onClose}
    const sheet = screen.getByTestId('word-detail-sheet');
    const backdrop = sheet.querySelector('.bg-black\\/40') as HTMLElement;
    if (backdrop) fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });

  it('plays EN audio when English button clicked', () => {
    render(<WordDetailSheet word={MOCK_WORD} progress={null} onClose={jest.fn()} />);
    fireEvent.click(screen.getByText(/English/));
    expect(mockPlayWordEn).toHaveBeenCalledWith('/audio/en/cat.mp3');
  });

  it('plays ZH audio when Mandarin button clicked', () => {
    render(<WordDetailSheet word={MOCK_WORD} progress={null} onClose={jest.fn()} />);
    fireEvent.click(screen.getByText(/Mandarin/));
    expect(mockPlayWordEn).toHaveBeenCalledWith('/audio/zh/mao.mp3');
  });

  it('shows mastery stats when progress provided', () => {
    render(<WordDetailSheet word={MOCK_WORD} progress={MOCK_PROGRESS} onClose={jest.fn()} />);
    expect(screen.getByText(/Seen: 5 times/)).toBeInTheDocument();
    expect(screen.getByText(/Correct: 3 times/)).toBeInTheDocument();
  });

  it('shows zero stats when no progress', () => {
    render(<WordDetailSheet word={MOCK_WORD} progress={null} onClose={jest.fn()} />);
    expect(screen.getByText(/Seen: 0 times/)).toBeInTheDocument();
  });

  it('shows mastery label', () => {
    render(<WordDetailSheet word={MOCK_WORD} progress={MOCK_PROGRESS} onClose={jest.fn()} />);
    expect(screen.getByText(/Recognized/)).toBeInTheDocument();
  });
});
