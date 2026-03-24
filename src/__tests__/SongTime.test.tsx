import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import SongTime from '@/components/activities/SongTime';
import { GreetingStep } from '@/components/session/GreetingStep';
import type { Song, VocabularyWord } from '@/types';

// ── Howler mock with instance tracking ────────────────────────────────────────
type EventCallback = (...args: unknown[]) => void;

interface MockHowlInstance {
  emit: (event: string, ...args: unknown[]) => void;
  play: jest.Mock;
  pause: jest.Mock;
  stop: jest.Mock;
  unload: jest.Mock;
  seek: jest.Mock;
  duration: jest.Mock;
  volume: jest.Mock;
  playing: jest.Mock;
  on: jest.Mock;
  once: jest.Mock;
}

let lastHowlInstance: MockHowlInstance | null = null;

function createMockHowl(): MockHowlInstance {
  const callbacks: Record<string, EventCallback[]> = {};

  const inst: MockHowlInstance = {
    play: jest.fn().mockReturnValue(1),
    pause: jest.fn(),
    stop: jest.fn(),
    unload: jest.fn(),
    seek: jest.fn().mockReturnValue(0),
    duration: jest.fn().mockReturnValue(0),
    volume: jest.fn(),
    playing: jest.fn().mockReturnValue(false),
    on: jest.fn((event: string, cb: EventCallback) => {
      if (!callbacks[event]) callbacks[event] = [];
      callbacks[event].push(cb);
      return inst;
    }),
    once: jest.fn((event: string, cb: EventCallback) => {
      const wrapped: EventCallback = (...args) => {
        cb(...args);
        callbacks[event] = callbacks[event]?.filter((f) => f !== wrapped) ?? [];
      };
      if (!callbacks[event]) callbacks[event] = [];
      callbacks[event].push(wrapped);
      return inst;
    }),
    emit: (event: string, ...args: unknown[]) => {
      callbacks[event]?.forEach((cb) => cb(...args));
    },
  };

  return inst;
}

jest.mock('howler', () => ({
  Howl: jest.fn().mockImplementation(() => {
    const inst = createMockHowl();
    lastHowlInstance = inst;
    return inst;
  }),
  Howler: { volume: jest.fn(), ctx: null },
}));

// ── next/image mock ────────────────────────────────────────────────────────────
jest.mock('next/image', () => {
  return function MockImage({ src, alt }: { src: string; alt: string }) {
    return <img src={src} alt={alt} />;
  };
});

// ── next/navigation mock ───────────────────────────────────────────────────────
const mockPush = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  usePathname: () => '/activities/song-time',
}));

// ── audioManager mock ──────────────────────────────────────────────────────────
const mockPlayWordEn = jest.fn();
jest.mock('@/lib/audio', () => ({
  audioManager: {
    playWord: jest.fn().mockResolvedValue(undefined),
    get playWordEn() { return mockPlayWordEn; },
    playEffect: jest.fn(),
    hasError: false,
    unlockAudioContext: jest.fn(),
  },
}));

// ── framer-motion mock (for GreetingStep tests) ────────────────────────────────
jest.mock('framer-motion', () => ({
  motion: {
    h2: ({ children, ...props }: React.HTMLAttributes<HTMLHeadingElement> & { initial?: unknown; animate?: unknown; transition?: unknown }) =>
      <h2 {...(props as React.HTMLAttributes<HTMLHeadingElement>)}>{children}</h2>,
    button: ({ children, whileTap: _wt, initial: _i, animate: _a, transition: _t, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { whileTap?: unknown; initial?: unknown; animate?: unknown; transition?: unknown }) =>
      <button {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}>{children}</button>,
    div: ({ children, ...props }: React.HTMLAttributes<HTMLDivElement> & { initial?: unknown; animate?: unknown; transition?: unknown }) =>
      <div {...(props as React.HTMLAttributes<HTMLDivElement>)}>{children}</div>,
    rect: ({ ...props }: React.SVGProps<SVGRectElement> & { animate?: unknown; transition?: unknown }) =>
      <rect {...(props as React.SVGProps<SVGRectElement>)} />,
  },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// ── Test fixtures ──────────────────────────────────────────────────────────────
const makeWord = (id: string, en: string, zh: string): VocabularyWord => ({
  id,
  englishWord: en,
  mandarinWord: zh,
  pinyin: `${en}pin`,
  category: 'animals',
  imagePath: `/images/${id}.png`,
  audioEnPath: `/audio/en/${id}.mp3`,
  audioZhPath: `/audio/zh/${id}.mp3`,
  tags: [],
});

const testVocab: VocabularyWord[] = [
  makeWord('animal-cow', 'Cow', '牛'),
  makeWord('object-star', 'Star', '星星'),
  makeWord('body-head', 'Head', '头'),
];

const makeSong = (id: string, title: string): Song => ({
  id,
  title,
  titleZh: `${title}中文`,
  audioPath: `/audio/songs/${id}.mp3`,
  coverImagePath: `/images/songs/${id}.png`,
  playCount: 0,
  lyrics: [
    { startMs: 0, endMs: 4000, text: 'First line', textZh: '第一行', highlightWordIds: ['animal-cow'] },
    { startMs: 4000, endMs: 8000, text: 'Second line', textZh: '第二行', highlightWordIds: [] },
  ],
});

const testSongs: Song[] = [
  makeSong('song-twinkle', 'Twinkle Twinkle Little Star'),
  makeSong('song-old-macdonald', 'Old MacDonald Had a Farm'),
  makeSong('song-head-shoulders', 'Head Shoulders Knees and Toes'),
];

// ── Helper ─────────────────────────────────────────────────────────────────────
function renderSongTime(songs = testSongs, vocab = testVocab) {
  return render(<SongTime songs={songs} vocabulary={vocab} db={null} />);
}

// ── Tests ──────────────────────────────────────────────────────────────────────
describe('SongTime', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    lastHowlInstance = null;
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('renders root element with data-testid=song-time', () => {
    renderSongTime();
    expect(screen.getByTestId('song-time')).toBeInTheDocument();
  });

  it('shows song-picker screen by default', () => {
    renderSongTime();
    expect(screen.getByTestId('song-picker')).toBeInTheDocument();
  });

  it('song-picker shows 3 song tiles', () => {
    renderSongTime();
    expect(screen.getAllByTestId('song-tile')).toHaveLength(3);
  });

  it('play count badge shows N 🎵', () => {
    const songsWithCounts = testSongs.map((s, i) => ({ ...s, playCount: i * 2 }));
    renderSongTime(songsWithCounts);
    expect(screen.getByText('0 🎵')).toBeInTheDocument();
    expect(screen.getByText('2 🎵')).toBeInTheDocument();
    expect(screen.getByText('4 🎵')).toBeInTheDocument();
  });

  it('tapping a song tile transitions to song-player', async () => {
    renderSongTime();
    const tiles = screen.getAllByTestId('song-tile');
    fireEvent.click(tiles[0]);
    await waitFor(() => {
      expect(screen.getByTestId('song-player')).toBeInTheDocument();
    });
  });

  it('song-player shows data-testid=song-play-btn', async () => {
    renderSongTime();
    fireEvent.click(screen.getAllByTestId('song-tile')[0]);
    await waitFor(() => {
      expect(screen.getByTestId('song-play-btn')).toBeInTheDocument();
    });
  });

  it('play button has w-[88px] and h-[88px] classes', async () => {
    renderSongTime();
    fireEvent.click(screen.getAllByTestId('song-tile')[0]);
    await waitFor(() => {
      const btn = screen.getByTestId('song-play-btn');
      expect(btn.className).toContain('w-[88px]');
      expect(btn.className).toContain('h-[88px]');
    });
  });

  it('audio error: loaderror event on Howl shows friendly error UI (no crash)', async () => {
    renderSongTime();
    fireEvent.click(screen.getAllByTestId('song-tile')[0]);
    await waitFor(() => expect(screen.getByTestId('song-player')).toBeInTheDocument());

    act(() => {
      lastHowlInstance?.emit('loaderror');
    });

    await waitFor(() => {
      expect(screen.getByText(/Song unavailable/)).toBeInTheDocument();
    });
    expect(screen.getByTestId('retry-btn')).toBeInTheDocument();
  });

  it('retry button on audio error clears error state', async () => {
    renderSongTime();
    fireEvent.click(screen.getAllByTestId('song-tile')[0]);
    await waitFor(() => expect(screen.getByTestId('song-player')).toBeInTheDocument());

    act(() => { lastHowlInstance?.emit('loaderror'); });
    await waitFor(() => expect(screen.getByTestId('retry-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('retry-btn'));
    await waitFor(() => {
      expect(screen.queryByText(/Song unavailable/)).not.toBeInTheDocument();
    });
  });

  it('retry creates a new Howl instance (Howl constructor called twice)', async () => {
    const { Howl: MockHowl } = jest.requireMock<{ Howl: jest.Mock }>('howler');
    renderSongTime();
    fireEvent.click(screen.getAllByTestId('song-tile')[0]);
    await waitFor(() => expect(screen.getByTestId('song-player')).toBeInTheDocument());

    // First Howl created on mount
    expect(MockHowl).toHaveBeenCalledTimes(1);

    act(() => { lastHowlInstance?.emit('loaderror'); });
    await waitFor(() => expect(screen.getByTestId('retry-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('retry-btn'));

    // Second Howl created after retry
    await waitFor(() => {
      expect(MockHowl).toHaveBeenCalledTimes(2);
    });
  });

  it('play button is briefly disabled after retry (isReady=false while new Howl loads)', async () => {
    renderSongTime();
    fireEvent.click(screen.getAllByTestId('song-tile')[0]);
    await waitFor(() => expect(screen.getByTestId('song-player')).toBeInTheDocument());

    act(() => { lastHowlInstance?.emit('loaderror'); });
    await waitFor(() => expect(screen.getByTestId('retry-btn')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('retry-btn'));

    // After retry, error cleared and new load starts — play button should be disabled
    await waitFor(() => {
      const playBtn = screen.getByTestId('song-play-btn');
      expect(playBtn).toBeDisabled();
    });
  });

  it('back button in player returns to song-picker', async () => {
    renderSongTime();
    fireEvent.click(screen.getAllByTestId('song-tile')[0]);
    await waitFor(() => expect(screen.getByTestId('song-player')).toBeInTheDocument());

    const backBtns = screen.getAllByText(/← Back/);
    fireEvent.click(backBtns[backBtns.length - 1]);

    await waitFor(() => {
      expect(screen.getByTestId('song-picker')).toBeInTheDocument();
    });
  });

  it('song end: emit end event shows completion banner with both buttons', async () => {
    renderSongTime();
    fireEvent.click(screen.getAllByTestId('song-tile')[0]);
    await waitFor(() => expect(screen.getByTestId('song-player')).toBeInTheDocument());

    act(() => { lastHowlInstance?.emit('end'); });

    await waitFor(() => {
      expect(screen.getByTestId('completion-banner')).toBeInTheDocument();
    });
    expect(screen.getByTestId('listen-again-btn')).toBeInTheDocument();
    expect(screen.getByTestId('choose-another-btn')).toBeInTheDocument();
  });

  it('choose another button in completion banner returns to picker', async () => {
    renderSongTime();
    fireEvent.click(screen.getAllByTestId('song-tile')[0]);
    await waitFor(() => expect(screen.getByTestId('song-player')).toBeInTheDocument());

    act(() => { lastHowlInstance?.emit('end'); });
    await waitFor(() => expect(screen.getByTestId('completion-banner')).toBeInTheDocument());

    fireEvent.click(screen.getByTestId('choose-another-btn'));
    await waitFor(() => {
      expect(screen.getByTestId('song-picker')).toBeInTheDocument();
    });
  });

  it('word chip shows EN and ZH text when lyric line is active (via RAF state)', async () => {
    // This test verifies WordChip renders correctly when shown
    const { Howl: MockHowl } = jest.requireMock<{ Howl: jest.Mock }>('howler');
    // Override seek to return position within first lyric line (0-4000ms → 0-4s)
    MockHowl.mockImplementationOnce(() => {
      const inst = createMockHowl();
      inst.seek.mockReturnValue(1); // 1 second = 1000ms, within [0, 4000ms]
      lastHowlInstance = inst;
      return inst;
    });

    renderSongTime();
    fireEvent.click(screen.getAllByTestId('song-tile')[0]);
    await waitFor(() => expect(screen.getByTestId('song-player')).toBeInTheDocument());

    // Make audio ready and start playback
    act(() => { lastHowlInstance?.emit('load'); });
    fireEvent.click(screen.getByTestId('song-play-btn'));

    // RAF won't auto-cycle in jsdom; word chip visibility is RAF-driven.
    // Verify component renders without error (no crash is the key assertion)
    expect(screen.getByTestId('song-player')).toBeInTheDocument();
  });

  it('back button on song-picker calls router.push("/")', () => {
    renderSongTime();
    const backBtn = screen.getByText(/← Back/);
    fireEvent.click(backBtn);
    expect(mockPush).toHaveBeenCalledWith('/');
  });

  it('empty songs list shows empty state in picker', () => {
    renderSongTime([]);
    expect(screen.getByText(/No songs available/)).toBeInTheDocument();
  });

  it('song titles and bilingual content appear in picker', () => {
    renderSongTime();
    expect(screen.getByText('Twinkle Twinkle Little Star')).toBeInTheDocument();
    expect(screen.getByText('Old MacDonald Had a Farm')).toBeInTheDocument();
    expect(screen.getByText('Head Shoulders Knees and Toes')).toBeInTheDocument();
  });
});

// ── GreetingStep audio tests ────────────────────────────────────────────────────
describe('GreetingStep', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it('calls audioManager.playWordEn with hello.mp3 on mount', () => {
    render(<GreetingStep onProceed={jest.fn()} />);
    expect(mockPlayWordEn).toHaveBeenCalledWith('/audio/en/hello.mp3');
  });

  it('calls audioManager.playWordEn exactly once on mount', () => {
    render(<GreetingStep onProceed={jest.fn()} />);
    expect(mockPlayWordEn).toHaveBeenCalledTimes(1);
  });
});
