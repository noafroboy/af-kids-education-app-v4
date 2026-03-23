import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ParentDashboard from '@/app/parent/dashboard/page';
import type { VocabularyWord, WordProgress, Session } from '@/types';

jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, initial: _i, animate: _a, exit: _e, transition: _t, onClick, ...props }: React.HTMLAttributes<HTMLDivElement> & { initial?: unknown; animate?: unknown; exit?: unknown; transition?: unknown }) =>
      <div onClick={onClick} {...props}>{children}</div>,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

jest.mock('next/link', () =>
  function MockLink({ href, children }: { href: string; children: React.ReactNode }) {
    return <a href={href}>{children}</a>;
  }
);

jest.mock('next/image', () =>
  function MockImage({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} />;
  }
);

jest.mock('@/hooks/useAudio', () => ({
  useAudio: () => ({
    playWord: jest.fn(),
    playWordEn: jest.fn(),
    playEffect: jest.fn(),
    isPlaying: false,
    audioError: false,
  }),
}));

const mockGetAllWords = jest.fn();
const mockGetAllProgress = jest.fn();
const mockGetAllSessions = jest.fn();
const mockGetWeeklyStats = jest.fn();

jest.mock('@/hooks/useDB', () => ({
  useDB: () => ({ _isMock: true }),
}));

jest.mock('@/lib/db', () => ({
  getAllWords: (...args: unknown[]) => mockGetAllWords(...args),
  getAllProgress: (...args: unknown[]) => mockGetAllProgress(...args),
  getAllSessions: (...args: unknown[]) => mockGetAllSessions(...args),
}));

jest.mock('@/lib/progress', () => ({
  getWeeklyStats: (...args: unknown[]) => mockGetWeeklyStats(...args),
}));

const MOCK_WORDS: VocabularyWord[] = [
  { id: 'cat', englishWord: 'Cat', mandarinWord: '猫', pinyin: 'māo', category: 'animals', imagePath: '/img/cat.png', audioEnPath: '/en/cat.mp3', audioZhPath: '/zh/mao.mp3', tags: [] },
  { id: 'apple', englishWord: 'Apple', mandarinWord: '苹果', pinyin: 'píngguǒ', category: 'food', imagePath: '/img/apple.png', audioEnPath: '/en/apple.mp3', audioZhPath: '/zh/pingguo.mp3', tags: [] },
];

const MOCK_PROGRESS: WordProgress[] = [
  { wordId: 'cat', seenCount: 5, correctCount: 3, masteryLevel: 2, lastSeenAt: '2026-03-20T10:00:00Z' },
];

const MOCK_SESSIONS: Session[] = [
  { startedAt: '2026-03-20T09:00:00Z', completedAt: '2026-03-20T09:30:00Z', activityType: 'explore', mood: 'happy', wordIds: ['cat'], correctCount: 1, duration: 1800 },
];

describe('ParentDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetAllWords.mockResolvedValue(MOCK_WORDS);
    mockGetAllProgress.mockResolvedValue(MOCK_PROGRESS);
    mockGetAllSessions.mockResolvedValue(MOCK_SESSIONS);
    mockGetWeeklyStats.mockResolvedValue({ wordsThisWeek: 2, streak: 1, totalLearned: 1 });
  });

  it('renders loading skeleton initially', () => {
    render(<ParentDashboard />);
    expect(screen.getByTestId('parent-dashboard')).toBeInTheDocument();
    // Loading skeletons use animate-pulse
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeTruthy();
  });

  it('renders data-testid parent-dashboard', async () => {
    render(<ParentDashboard />);
    await waitFor(() => expect(screen.getByTestId('parent-dashboard')).toBeInTheDocument());
  });

  it('shows word list after loading', async () => {
    render(<ParentDashboard />);
    await waitFor(() => expect(screen.getAllByTestId('word-row')).toHaveLength(2));
  });

  it('shows empty state when no sessions', async () => {
    mockGetAllSessions.mockResolvedValue([]);
    render(<ParentDashboard />);
    await waitFor(() => expect(screen.getByText(/No activity yet/)).toBeInTheDocument());
  });

  it('shows weekly stats when sessions exist', async () => {
    render(<ParentDashboard />);
    await waitFor(() => expect(screen.getByText(/This week: 2 words/)).toBeInTheDocument());
  });

  it('shows streak count', async () => {
    render(<ParentDashboard />);
    await waitFor(() => expect(screen.getByText(/1 day streak/)).toBeInTheDocument());
  });

  it('shows streak calendar when sessions exist', async () => {
    render(<ParentDashboard />);
    await waitFor(() => expect(screen.getByTestId('streak-calendar')).toBeInTheDocument());
  });

  it('filters word list by category', async () => {
    render(<ParentDashboard />);
    await waitFor(() => screen.getAllByTestId('word-row'));

    fireEvent.click(screen.getByText('动物'));
    await waitFor(() => {
      const rows = screen.getAllByTestId('word-row');
      expect(rows).toHaveLength(1);
      expect(screen.getByText('Cat')).toBeInTheDocument();
      expect(screen.queryByText('Apple')).not.toBeInTheDocument();
    });
  });

  it('shows all words when 全部 tab selected', async () => {
    render(<ParentDashboard />);
    await waitFor(() => screen.getAllByTestId('word-row'));

    fireEvent.click(screen.getByText('动物'));
    fireEvent.click(screen.getByText('全部'));
    await waitFor(() => expect(screen.getAllByTestId('word-row')).toHaveLength(2));
  });

  it('opens WordDetailSheet when word row clicked', async () => {
    render(<ParentDashboard />);
    await waitFor(() => screen.getAllByTestId('word-row'));

    fireEvent.click(screen.getAllByTestId('word-row')[0]);
    await waitFor(() => expect(screen.getByTestId('word-detail-sheet')).toBeInTheDocument());
  });

  it('closes WordDetailSheet when onClose called', async () => {
    render(<ParentDashboard />);
    await waitFor(() => screen.getAllByTestId('word-row'));

    fireEvent.click(screen.getAllByTestId('word-row')[0]);
    await waitFor(() => screen.getByTestId('word-detail-sheet'));

    fireEvent.click(screen.getByLabelText('Close'));
    await waitFor(() => expect(screen.queryByTestId('word-detail-sheet')).not.toBeInTheDocument());
  });

  it('has settings link', async () => {
    render(<ParentDashboard />);
    await waitFor(() => expect(screen.getByRole('link', { name: /Settings/i })).toBeInTheDocument());
  });
});
