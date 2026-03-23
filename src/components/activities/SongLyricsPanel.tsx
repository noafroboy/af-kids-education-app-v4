'use client';

import type { RefObject } from 'react';
import WordChip from './WordChip';
import type { LyricLine, VocabularyWord } from '@/types';

interface SongLyricsPanelProps {
  lyrics: LyricLine[];
  vocabulary: VocabularyWord[];
  currentLineIndex: number;
  activatedWordId: string | null;
  lineRef: RefObject<HTMLDivElement | null>;
  onWordTap: (word: VocabularyWord) => void;
  songEnded: boolean;
  onListenAgain: () => void;
  onBack: () => void;
}

export default function SongLyricsPanel({
  lyrics,
  vocabulary,
  currentLineIndex,
  activatedWordId,
  lineRef,
  onWordTap,
  songEnded,
  onListenAgain,
  onBack,
}: SongLyricsPanelProps) {
  return (
    <>
      <div className="w-full flex-1 overflow-y-auto flex flex-col gap-3 pb-4">
        {lyrics.map((line, i) => {
          const isActive = i === currentLineIndex;
          const lineWords = line.highlightWordIds
            .map((wid) => vocabulary.find((v) => v.id === wid))
            .filter((w): w is VocabularyWord => w !== undefined);

          return (
            <div
              key={i}
              ref={isActive ? lineRef : null}
              className={`rounded-2xl p-3 transition-colors ${isActive ? 'bg-[#FFE0D5]' : 'bg-transparent'}`}
            >
              <p
                className={`font-bold ${isActive ? 'text-[#FF6B35] text-lg' : 'text-slate-400 text-sm'}`}
                style={{ fontFamily: 'var(--font-fredoka)' }}
              >
                {line.text}
              </p>
              <p className="text-slate-500 text-sm">{line.textZh}</p>
              {isActive && lineWords.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {lineWords.map((word) => (
                    <WordChip
                      key={word.id}
                      word={word}
                      isActive={activatedWordId === word.id}
                      onTap={onWordTap}
                    />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {songEnded && (
        <div
          data-testid="completion-banner"
          className="w-full bg-[#C7B8EA] rounded-3xl p-6 flex flex-col items-center gap-3"
        >
          <p className="text-2xl font-bold text-white" style={{ fontFamily: 'var(--font-fredoka)' }}>
            Great singing! / 唱得真棒！
          </p>
          <div className="flex gap-3">
            <button
              data-testid="listen-again-btn"
              onClick={onListenAgain}
              className="px-4 py-2 bg-white text-[#C7B8EA] rounded-2xl font-bold text-sm"
            >
              Listen Again / 再听一次
            </button>
            <button
              data-testid="choose-another-btn"
              onClick={onBack}
              className="px-4 py-2 bg-[#FF6B35] text-white rounded-2xl font-bold text-sm"
            >
              Choose Another / 换一首
            </button>
          </div>
        </div>
      )}
    </>
  );
}
