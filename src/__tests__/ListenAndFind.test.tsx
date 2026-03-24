import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { ListenAndFind } from '@/components/activities/ListenAndFind';
import { audioManager } from '@/lib/audio';
import type { VocabularyWord } from '@/types';

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    button: ({ children, variants: _v, initial: _i, animate: _a, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variants?: unknown; initial?: unknown; animate?: unknown }) => (
      <button {...props}>{children}</button>
    ),
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { initial?: unknown; animate?: unknown; transition?: unknown }) => (
      <div {...props}>{children}</div>
    ),
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock next/image
jest.mock('next/image', () => {
  return function MockImage({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} />;
  };
});

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), back: jest.fn() }),
  usePathname: () => '/activities/listen-find',
}));

// Mock useProgress
const mockUpdateWord = jest.fn().mockResolvedValue(undefined);
const mockSaveSession = jest.fn().mockResolvedValue(undefined);
jest.mock('@/hooks/useProgress', () => ({
  useProgress: () => ({
    updateWord: mockUpdateWord,
    saveSession: mockSaveSession,
    getAllProgress: jest.fn().mockResolvedValue([]),
    getWeeklyStats: jest.fn().mockResolvedValue({ wordsThisWeek: 0, streak: 0, totalLearned: 0 }),
    isLoading: false,
  }),
}));

// Mock useAudio
const mockPlayEffect = jest.fn();
jest.mock('@/hooks/useAudio', () => ({
  useAudio: () => ({
    playWord: jest.fn(),
    playWordEn: jest.fn(),
    playEffect: mockPlayEffect,
    isPlaying: false,
    audioError: false,
  }),
}));

// Mock audioManager (factory uses jest.fn() directly to avoid hoisting TDZ)
jest.mock('@/lib/audio', () => ({
  audioManager: { playWordEn: jest.fn() },
}));

// Keep global.Audio mock so any residual usage doesn't throw
const mockPlay = jest.fn().mockResolvedValue(undefined);
Object.defineProperty(global, 'Audio', {
  writable: true,
  value: jest.fn().mockImplementation(() => ({ play: mockPlay })),
});

const makeWord = (id: string, english: string, category = 'animals'): VocabularyWord => ({
  id,
  englishWord: english,
  mandarinWord: `${english}字`,
  pinyin: `${english}pin`,
  category: category as VocabularyWord['category'],
  imagePath: `/images/${id}.png`,
  audioEnPath: `/audio/en/${id}.mp3`,
  audioZhPath: `/audio/zh/${id}.mp3`,
  tags: [],
});

const testWords: VocabularyWord[] = [
  makeWord('cat', 'Cat'),
  makeWord('dog', 'Dog'),
  makeWord('bird', 'Bird'),
  makeWord('fish', 'Fish'),
  makeWord('frog', 'Frog'),
  makeWord('bear', 'Bear'),
];

describe('ListenAndFind', () => {
  const mockOnComplete = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders container with data-testid=listen-and-find', () => {
    render(<ListenAndFind wordList={testWords} age={4} onComplete={mockOnComplete} />);
    expect(screen.getByTestId('listen-and-find')).toBeInTheDocument();
  });

  it('shows 3 choice cards when age=3', () => {
    render(<ListenAndFind wordList={testWords} age={3} onComplete={mockOnComplete} />);
    const cards = screen.getAllByTestId('choice-card');
    expect(cards).toHaveLength(3);
  });

  it('shows 4 choice cards when age=4', () => {
    render(<ListenAndFind wordList={testWords} age={4} onComplete={mockOnComplete} />);
    const cards = screen.getAllByTestId('choice-card');
    expect(cards).toHaveLength(4);
  });

  it('progress bar has data-testid=listen-find-progress', () => {
    render(<ListenAndFind wordList={testWords} age={4} onComplete={mockOnComplete} />);
    expect(screen.getByTestId('listen-find-progress')).toBeInTheDocument();
  });

  it('plays audio on mount with first word audioEnPath', () => {
    render(<ListenAndFind wordList={testWords} age={4} onComplete={mockOnComplete} />);
    expect(audioManager.playWordEn).toHaveBeenCalledWith(testWords[0].audioEnPath);
  });

  it('Play Again button calls audioManager.playWordEn with current word audioEnPath', () => {
    render(<ListenAndFind wordList={testWords} age={4} onComplete={mockOnComplete} />);
    jest.mocked(audioManager.playWordEn).mockClear();
    const playAgainBtn = screen.getByText('Play Again / 再播放');
    fireEvent.click(playAgainBtn);
    expect(audioManager.playWordEn).toHaveBeenCalledWith(testWords[0].audioEnPath);
  });

  it('tapping correct card calls updateWord with wordId and true', async () => {
    const singleWordList = [testWords[0]];
    render(<ListenAndFind wordList={singleWordList} age={3} onComplete={mockOnComplete} />);
    const cards = screen.getAllByTestId('choice-card');
    // With 1 word and 3 choices, first card corresponds to a choice; we need the correct card
    // The correct word is testWords[0] = 'Cat'; find by alt text
    const correctCard = screen.getByAltText('Cat');
    fireEvent.click(correctCard.closest('[data-testid="choice-card"]')!);
    await waitFor(() => {
      expect(mockUpdateWord).toHaveBeenCalledWith(testWords[0].id, true);
    });
    expect(cards.length).toBeGreaterThan(0);
  });

  it('plays correct effect on correct tap', async () => {
    const singleWordList = [testWords[0]];
    render(<ListenAndFind wordList={singleWordList} age={3} onComplete={mockOnComplete} />);
    const correctCard = screen.getByAltText('Cat');
    fireEvent.click(correctCard.closest('[data-testid="choice-card"]')!);
    await waitFor(() => {
      expect(mockPlayEffect).toHaveBeenCalledWith('correct');
    });
  });

  it('tapping wrong card does NOT call updateWord', async () => {
    render(<ListenAndFind wordList={testWords} age={4} onComplete={mockOnComplete} />);
    // Find a distractor card (not 'Cat')
    const allCards = screen.getAllByTestId('choice-card');
    // The target is testWords[0] = Cat; click the first card that is NOT Cat
    const catImg = screen.queryByAltText('Cat');
    const catCard = catImg?.closest('[data-testid="choice-card"]');
    const wrongCard = allCards.find((c) => c !== catCard);
    if (wrongCard) fireEvent.click(wrongCard);
    expect(mockUpdateWord).not.toHaveBeenCalled();
  });

  it('plays incorrect effect on wrong tap', async () => {
    render(<ListenAndFind wordList={testWords} age={4} onComplete={mockOnComplete} />);
    const allCards = screen.getAllByTestId('choice-card');
    const catImg = screen.queryByAltText('Cat');
    const catCard = catImg?.closest('[data-testid="choice-card"]');
    const wrongCard = allCards.find((c) => c !== catCard);
    if (wrongCard) fireEvent.click(wrongCard);
    await waitFor(() => {
      expect(mockPlayEffect).toHaveBeenCalledWith('incorrect');
    });
  });

  it('tapping wrong card twice shows bilingual reveal text', async () => {
    render(<ListenAndFind wordList={testWords} age={4} onComplete={mockOnComplete} />);
    const allCards = screen.getAllByTestId('choice-card');
    const catImg = screen.queryByAltText('Cat');
    const catCard = catImg?.closest('[data-testid="choice-card"]');
    const wrongCards = allCards.filter((c) => c !== catCard);

    // First wrong tap
    if (wrongCards[0]) fireEvent.click(wrongCards[0]);
    // Wait for shake to clear
    act(() => { jest.advanceTimersByTime(400); });

    // Second wrong tap
    if (wrongCards[1] ?? wrongCards[0]) fireEvent.click(wrongCards[1] ?? wrongCards[0]);

    await waitFor(() => {
      expect(screen.getByText(/这是.*Cat/)).toBeInTheDocument();
    });
  });

  it('reveal does NOT call updateWord', async () => {
    render(<ListenAndFind wordList={testWords} age={4} onComplete={mockOnComplete} />);
    const allCards = screen.getAllByTestId('choice-card');
    const catImg = screen.queryByAltText('Cat');
    const catCard = catImg?.closest('[data-testid="choice-card"]');
    const wrongCards = allCards.filter((c) => c !== catCard);

    if (wrongCards[0]) fireEvent.click(wrongCards[0]);
    act(() => { jest.advanceTimersByTime(400); });
    if (wrongCards[1] ?? wrongCards[0]) fireEvent.click(wrongCards[1] ?? wrongCards[0]);

    // updateWord should NOT be called during reveal
    expect(mockUpdateWord).not.toHaveBeenCalled();
  });

  it('onComplete is called after all words are processed', async () => {
    const singleWordList = [testWords[0]];
    render(<ListenAndFind wordList={singleWordList} age={3} onComplete={mockOnComplete} />);
    const correctCard = screen.getByAltText('Cat');
    fireEvent.click(correctCard.closest('[data-testid="choice-card"]')!);
    act(() => { jest.advanceTimersByTime(1200); });
    await waitFor(() => {
      expect(mockOnComplete).toHaveBeenCalledWith(
        expect.objectContaining({ wordsAttempted: 1 })
      );
    });
  });
});
