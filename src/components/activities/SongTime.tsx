'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { IDBPDatabase } from 'idb';
import { putSong } from '@/lib/db';
import SongPicker from './SongPicker';
import SongPlayer from './SongPlayer';
import type { Song, VocabularyWord } from '@/types';

interface SongTimeProps {
  songs: Song[];
  vocabulary: VocabularyWord[];
  db: IDBPDatabase | null;
}

export default function SongTime({ songs, vocabulary, db }: SongTimeProps) {
  const router = useRouter();
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [playCountMap, setPlayCountMap] = useState<Record<string, number>>(
    Object.fromEntries(songs.map((s) => [s.id, s.playCount ?? 0]))
  );

  function handleSongEnd() {
    if (!selectedSong) return;
    const newCount = (playCountMap[selectedSong.id] ?? 0) + 1;
    setPlayCountMap((prev) => ({ ...prev, [selectedSong.id]: newCount }));
    if (db) {
      putSong(db as never, { ...selectedSong, playCount: newCount }).catch(() => {});
    }
  }

  return (
    <div data-testid="song-time">
      {selectedSong ? (
        <SongPlayer
          song={selectedSong}
          vocabulary={vocabulary}
          onBack={() => setSelectedSong(null)}
          onSongEnd={handleSongEnd}
        />
      ) : (
        <SongPicker
          songs={songs}
          playCountMap={playCountMap}
          onSelect={setSelectedSong}
          onBack={() => router.push('/')}
        />
      )}
    </div>
  );
}
