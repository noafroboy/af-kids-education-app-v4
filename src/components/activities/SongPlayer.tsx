'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import { audioManager } from '@/lib/audio';
import SongLyricsPanel from './SongLyricsPanel';
import { SongCoverArt } from './SongCoverArt';
import { SongPlayerControls } from './SongPlayerControls';
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
  const [retryCount, setRetryCount] = useState(0);

  const howlRef = useRef<Howl | null>(null);
  const rafRef = useRef<number>(0);
  const currentLineRef = useRef<HTMLDivElement | null>(null);
  const playingRef = useRef(playing);
  const wordTapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    setAudioReady(false);
    setAudioError(false);
    const howl = new Howl({ src: [song.audioPath], html5: true });
    howlRef.current = howl;
    howl.on('load', () => setAudioReady(true));
    howl.on('loaderror', () => setAudioError(true));
    howl.on('end', handleSongEnd);
    return () => {
      cancelRaf();
      if (wordTapTimerRef.current) clearTimeout(wordTapTimerRef.current);
      howl.unload();
    };
  }, [song.audioPath, handleSongEnd, cancelRaf, retryCount]);

  useEffect(() => {
    if (currentLineRef.current) {
      currentLineRef.current.scrollIntoView?.({ behavior: 'smooth', block: 'center' });
    }
  }, [currentLineIndex]);

  const handleRetry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

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
      if (wordTapTimerRef.current) clearTimeout(wordTapTimerRef.current);
      wordTapTimerRef.current = setTimeout(() => {
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

      <SongCoverArt src={song.coverImagePath} alt={song.title} />

      <SongPlayerControls
        isReady={audioReady}
        isPlaying={playing}
        hasError={audioError}
        onPlayPause={handlePlayPause}
        onRetry={handleRetry}
        onBack={onBack}
      />

      {!audioError && (
        <SongLyricsPanel
          lyrics={song.lyrics}
          vocabulary={vocabulary}
          currentLineIndex={currentLineIndex}
          activatedWordId={activatedWordId}
          lineRef={currentLineRef}
          onWordTap={handleWordTap}
          songEnded={songEnded}
          onListenAgain={handleListenAgain}
          onBack={onBack}
        />
      )}

      {!audioError && (
        <button onClick={onBack} className="self-start px-4 py-2 text-slate-500 font-semibold text-sm rounded-xl">
          ← Back / 返回
        </button>
      )}
    </div>
  );
}
