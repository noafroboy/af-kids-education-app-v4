'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDB } from '@/hooks/useDB';
import { getAllSongs, getAllWords } from '@/lib/db';
import { ChildLayout } from '@/components/layouts/ChildLayout';
import SongTime from '@/components/activities/SongTime';
import type { Song, VocabularyWord } from '@/types';

export default function SongTimePage() {
  const db = useDB();
  const router = useRouter();
  const [songs, setSongs] = useState<Song[]>([]);
  const [vocabulary, setVocabulary] = useState<VocabularyWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadData = useCallback(async () => {
    if (!db) return;
    setIsLoading(true);
    setError(false);
    try {
      const [allSongs, allWords] = await Promise.all([
        getAllSongs(db as never),
        getAllWords(db as never),
      ]);
      setSongs(allSongs);
      setVocabulary(allWords);
    } catch {
      setError(true);
    } finally {
      setIsLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (isLoading) {
    return (
      <ChildLayout>
        <div className="min-h-screen bg-[#FFF9F0] flex items-center justify-center">
          <div className="text-6xl animate-float">🐼</div>
        </div>
      </ChildLayout>
    );
  }

  if (error) {
    return (
      <ChildLayout>
        <div className="min-h-screen bg-[#FFF9F0] flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-xl text-slate-500 text-center">
            Could not load songs. / 无法加载歌曲。
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-8 py-4 bg-[#FF6B35] text-white rounded-2xl font-bold text-lg"
          >
            Go Home / 回家
          </button>
        </div>
      </ChildLayout>
    );
  }

  return (
    <ChildLayout>
      <SongTime songs={songs} vocabulary={vocabulary} db={db} />
    </ChildLayout>
  );
}
