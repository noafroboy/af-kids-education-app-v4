'use client';

import { useState } from 'react';
import { useDB } from './useDB';
import { updateWordProgress, getWeeklyStats, recordSession } from '@/lib/progress';
import { getAllProgress } from '@/lib/db';
import type { WordProgress, Session } from '@/types';

export function useProgress() {
  const db = useDB();
  const [isLoading, setIsLoading] = useState(false);

  async function updateWord(wordId: string, wasCorrect: boolean): Promise<void> {
    if (!db) return;
    setIsLoading(true);
    try {
      await updateWordProgress(db as never, wordId, wasCorrect);
    } finally {
      setIsLoading(false);
    }
  }

  async function getAll(): Promise<WordProgress[]> {
    if (!db) return [];
    return getAllProgress(db as never);
  }

  async function getStats() {
    if (!db) return { wordsThisWeek: 0, streak: 0, totalLearned: 0 };
    return getWeeklyStats(db as never);
  }

  async function saveSession(session: Session): Promise<void> {
    if (!db) return;
    await recordSession(db as never, session);
  }

  return {
    updateWord,
    getAllProgress: getAll,
    getWeeklyStats: getStats,
    saveSession,
    isLoading,
  };
}
