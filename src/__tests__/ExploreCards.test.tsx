import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExploreCards } from '@/components/activities/ExploreCards';
import type { VocabularyWord } from '@/types';

// Mock canvas-confetti
jest.mock('canvas-confetti', () => jest.fn());

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, whileTap: _wt, ...props }: React.HTMLAttributes<HTMLDivElement> & { whileTap?: unknown }) => (
      <div {...props}>{children}</div>
    ),
    h1: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) => <p {...props}>{children}</p>,
    span: ({ children, ...props }: React.HTMLAttributes<HTMLSpanElement>) => <span {...props}>{children}</span>,
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
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  usePathname: () => '/activities/explore-cards',
}));

// Mock useDB
jest.mock('@/hooks/useDB', () => ({
  useDB: () => null,
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
const mockPlayWord = jest.fn();
jest.mock('@/hooks/useAudio', () => ({
  useAudio: () => ({
    playWord: mockPlayWord,
    playEffect: jest.fn(),
    isPlaying: false,
    audioError: false,
  }),
}));

const testWords: VocabularyWord[] = [
  {
    id: 'test-cat',
    englishWord: 'Cat',
    mandarinWord: '猫',
    pinyin: 'māo',
    category: 'animals',
    imagePath: '/images/vocabulary/cat.png',
    audioEnPath: '/audio/en/cat.mp3',
    audioZhPath: '/audio/zh/mao.mp3',
    tags: [],
  },
  {
    id: 'test-dog',
    englishWord: 'Dog',
    mandarinWord: '狗',
    pinyin: 'gǒu',
    category: 'animals',
    imagePath: '/images/vocabulary/dog.png',
    audioEnPath: '/audio/en/dog.mp3',
    audioZhPath: '/audio/zh/gou.mp3',
    tags: [],
  },
];

describe('ExploreCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders explore-cards container', () => {
    render(<ExploreCards wordList={testWords} />);
    expect(screen.getByTestId('explore-cards')).toBeInTheDocument();
  });

  it('renders the first vocabulary card', () => {
    render(<ExploreCards wordList={testWords} />);
    expect(screen.getByTestId('vocab-card')).toBeInTheDocument();
    expect(screen.getByText('Cat')).toBeInTheDocument();
  });

  it('renders next button', () => {
    render(<ExploreCards wordList={testWords} />);
    expect(screen.getByTestId('card-next-btn')).toBeInTheDocument();
  });

  it('advances to next card on Next click', async () => {
    render(<ExploreCards wordList={testWords} />);
    fireEvent.click(screen.getByTestId('card-next-btn'));
    await waitFor(() => {
      expect(screen.getByText('Dog')).toBeInTheDocument();
    });
  });

  it('shows Done button on last card', async () => {
    render(<ExploreCards wordList={testWords} />);
    // Go to last card
    fireEvent.click(screen.getByTestId('card-next-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('card-next-btn')).toHaveTextContent(/Done/i);
    });
  });

  it('shows celebration overlay after completing all cards', async () => {
    render(<ExploreCards wordList={testWords} />);
    fireEvent.click(screen.getByTestId('card-next-btn'));
    await waitFor(() => screen.getByText('Dog'));
    fireEvent.click(screen.getByTestId('card-next-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('celebration-overlay')).toBeInTheDocument();
    });
  });

  it('plays audio when card is tapped', () => {
    render(<ExploreCards wordList={testWords} />);
    fireEvent.click(screen.getByTestId('vocab-card'));
    expect(mockPlayWord).toHaveBeenCalledWith('/audio/en/cat.mp3', '/audio/zh/mao.mp3');
  });
});
