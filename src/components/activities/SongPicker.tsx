'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Song } from '@/types';

interface SongPickerProps {
  songs: Song[];
  playCountMap: Record<string, number>;
  onSelect: (song: Song) => void;
  onBack: () => void;
}

export default function SongPicker({ songs, playCountMap, onSelect, onBack }: SongPickerProps) {
  const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

  if (songs.length === 0) {
    return (
      <div data-testid="song-picker" className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center gap-4 p-8">
        <p className="text-xl text-slate-500 text-center">No songs available / 暂无歌曲</p>
      </div>
    );
  }

  return (
    <div
      data-testid="song-picker"
      className="min-h-screen bg-[#FFF9F0] flex flex-col gap-6 p-4 max-w-[428px] mx-auto"
    >
      <div className="pt-4 text-center">
        <h2
          className="text-2xl font-bold text-[#C7B8EA]"
          style={{ fontFamily: 'var(--font-fredoka)' }}
        >
          Song Time / 歌曲时间
        </h2>
        <p className="text-slate-500 text-sm mt-1">Pick a song! / 选一首歌！</p>
      </div>

      <div className="flex flex-col gap-4">
        {songs.map((song) => (
          <button
            key={song.id}
            data-testid="song-tile"
            onClick={() => onSelect(song)}
            className="min-h-[120px] w-full bg-white rounded-3xl shadow-md flex items-center gap-4 p-4 text-left active:scale-95 transition-transform"
          >
            <div className="relative w-20 h-20 rounded-2xl overflow-hidden bg-purple-50 flex-shrink-0 flex items-center justify-center">
              {imgErrors[song.id] ? (
                <span className="text-3xl">🎵</span>
              ) : (
                <Image
                  src={song.coverImagePath}
                  alt={song.title}
                  fill
                  className="object-cover"
                  onError={() => setImgErrors((prev) => ({ ...prev, [song.id]: true }))}
                />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p
                className="text-lg font-bold text-slate-700 truncate"
                style={{ fontFamily: 'var(--font-fredoka)' }}
              >
                {song.title}
              </p>
              <p className="text-sm text-slate-500">{song.titleZh}</p>
              <span className="mt-1 inline-block bg-[#FF6B35] text-white text-xs font-bold px-2 py-0.5 rounded-full">
                {playCountMap[song.id] ?? 0} 🎵
              </span>
            </div>
          </button>
        ))}
      </div>

      <button
        onClick={onBack}
        className="mt-auto self-start px-4 min-h-[88px] flex items-center text-slate-500 font-semibold text-sm rounded-xl"
      >
        ← Back / 返回
      </button>
    </div>
  );
}
