'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import Image from 'next/image';
import { audioManager } from '@/lib/audio';
import SongLyricsPanel from './SongLyricsPanel';
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

      <button onClick={onBack} className="self-start px-4 py-2 text-slate-500 font-semibold text-sm rounded-xl">
        ← Back / 返回
      </button>
    </div>
  );
}
