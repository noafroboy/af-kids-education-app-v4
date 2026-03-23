'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import Image from 'next/image';
import { audioManager } from '@/lib/audio';
import WordChip from './WordChip';
import type { Song, VocabularyWord } from '@/types';

interface SongPlayerProps {
  song: Song;
  vocabulary: VocabularyWord[];
  onBack: () => void;
  onSongEnd: () => void;
}

export default function SongPlayer({ song, vocabulary, onBack, onSongEnd }: SongPlayerProps) {
  const [playing, setPlaying] = useState(false);
  const [audioReady, setAudioReady] = useState(false);
  const [audioError, setAudioError] = useState(false);
  const [currentLineIndex, setCurrentLineIndex] = useState(-1);
  const [activatedWordId, setActivatedWordId] = useState<string | null>(null);
  const [songEnded, setSongEnded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number>(0);
  const currentLineRef = useRef<HTMLDivElement | null>(null);
  const playingRef = useRef(playing);
  playingRef.current = playing;

  const cancelRaf = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
  }, []);

  const syncLoop = useCallback(() => {
    if (!howlRef.current || !playingRef.current) return;
    const posMs = (howlRef.current.seek() as number) * 1000;
    const idx = song.lyrics.findIndex((l) => posMs >= l.startMs && posMs < l.endMs);
    setCurrentLineIndex(idx);
    rafRef.current = requestAnimationFrame(syncLoop);
  }, [song.lyrics]);

  const startRaf = useCallback(() => {
    cancelRaf();
    rafRef.current = requestAnimationFrame(syncLoop);
  }, [cancelRaf, syncLoop]);

  const handleSongEnd = useCallback(() => {
    setPlaying(false);
    setSongEnded(true);
    cancelRaf();
    onSongEnd();
  }, [cancelRaf, onSongEnd]);

  useEffect(() => {
    const howl = new Howl({ src: [song.audioPath], html5: true });
    howlRef.current = howl;
    howl.on('load', () => setAudioReady(true));
    howl.on('loaderror', () => setAudioError(true));
    howl.on('end', handleSongEnd);
    return () => {
      cancelRaf();
      howl.unload();
    };
  }, [song.audioPath, handleSongEnd, cancelRaf]);

  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLineIndex]);

  function handlePlayPause() {
    if (!howlRef.current || audioError) return;
    if (playing) {
      howlRef.current.pause();
      cancelRaf();
      setPlaying(false);
    } else {
      howlRef.current.play();
      setPlaying(true);
      startRaf();
    }
  }

  function handleWordTap(word: VocabularyWord) {
    if (!howlRef.current) return;
    howlRef.current.pause();
    cancelRaf();
    setPlaying(false);
    setActivatedWordId(word.id);
    audioManager.playWord(word.audioEnPath, word.audioZhPath).then(() => {
      setTimeout(() => {
        setActivatedWordId(null);
        if (!songEnded && howlRef.current) {
          howlRef.current.play();
          setPlaying(true);
          startRaf();
        }
      }, 2000);
    });
  }

  function handleListenAgain() {
    setSongEnded(false);
    setCurrentLineIndex(-1);
    howlRef.current?.seek(0);
    howlRef.current?.play();
    setPlaying(true);
    startRaf();
  }

  if (audioError) {
    return (
      <div data-testid="song-player" className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center gap-4 p-8">
        <span className="text-5xl">🎵</span>
        <p className="text-xl text-slate-500 text-center">Song unavailable / 歌曲暂时无法播放</p>
        <button
          data-testid="retry-btn"
          onClick={() => { setAudioError(false); setAudioReady(false); }}
          className="px-6 py-3 bg-[#FF6B35] text-white rounded-2xl font-bold"
        >
          Retry / 重试
        </button>
        <button onClick={onBack} className="px-4 py-2 text-slate-500 font-semibold text-sm">
          ← Back / 返回
        </button>
      </div>
    );
  }

  return (
    <div
      data-testid="song-player"
      className="min-h-screen bg-[#FFF9F0] flex flex-col items-center gap-4 p-4 max-w-[428px] mx-auto"
    >
      <div className="pt-4 text-center">
        <h2 className="text-xl font-bold text-slate-700" style={{ fontFamily: 'var(--font-fredoka)' }}>
          {song.title}
        </h2>
        <p className="text-sm text-slate-500">{song.titleZh}</p>
      </div>

      <div className="relative w-32 h-32 rounded-2xl overflow-hidden bg-purple-50 flex items-center justify-center">
        {imgError ? (
          <span className="text-4xl">🎵</span>
        ) : (
          <Image src={song.coverImagePath} alt={song.title} fill className="object-cover"
            onError={() => setImgError(true)} />
        )}
      </div>

      {!audioReady && !audioError && (
        <p className="text-sm text-slate-400 animate-pulse">Loading audio... / 加载中...</p>
      )}

      <button
        data-testid="song-play-btn"
        onClick={handlePlayPause}
        disabled={!audioReady && !audioError}
        className="w-[88px] h-[88px] bg-[#FF6B35] text-white rounded-full text-4xl shadow-lg flex items-center justify-center disabled:opacity-50 transition-transform active:scale-95"
        aria-label={playing ? 'Pause' : 'Play'}
      >
        {playing ? '⏸' : '▶'}
      </button>

      <div className="w-full flex-1 overflow-y-auto flex flex-col gap-3 pb-4">
        {song.lyrics.map((line, i) => {
          const isActive = i === currentLineIndex;
          const lineWords = line.highlightWordIds
            .map((wid) => vocabulary.find((v) => v.id === wid))
            .filter((w): w is VocabularyWord => w !== undefined);

          return (
            <div
              key={i}
              ref={isActive ? currentLineRef : null}
              className={`rounded-2xl p-3 transition-colors ${isActive ? 'bg-[#FFE0D5]' : 'bg-transparent'}`}
            >
              <p className={`font-bold ${isActive ? 'text-[#FF6B35] text-lg' : 'text-slate-400 text-sm'}`}
                style={{ fontFamily: 'var(--font-fredoka)' }}>
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
                      onTap={handleWordTap}
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
              onClick={handleListenAgain}
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

      <button onClick={onBack} className="self-start px-4 py-2 text-slate-500 font-semibold text-sm rounded-xl">
        ← Back / 返回
      </button>
    </div>
  );
}
