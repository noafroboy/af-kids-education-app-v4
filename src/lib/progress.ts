import type { IDBPDatabase } from 'idb';
import { getProgress, putProgress, getAllProgress, addSession, getAllSessions } from './db';
import { formatDate } from './utils';
import type { Session, MasteryLevel } from '@/types';

export async function updateWordProgress(
  db: IDBPDatabase,
  wordId: string,
  wasCorrect: boolean
): Promise<void> {
  const existing = await getProgress(db as never, wordId);
  const now = new Date().toISOString();
  const seenCount = (existing?.seenCount ?? 0) + 1;
  const correctCount = (existing?.correctCount ?? 0) + (wasCorrect ? 1 : 0);

  let masteryLevel: MasteryLevel = existing?.masteryLevel ?? 0;
  if (masteryLevel === 0) masteryLevel = 1;
  if (masteryLevel === 1 && correctCount >= 3) masteryLevel = 2;
  if (masteryLevel === 2 && correctCount >= 8) masteryLevel = 3;

  await putProgress(db as never, {
    wordId,
    seenCount,
    correctCount,
    masteryLevel,
    lastSeenAt: now,
  });
}

export async function getWeeklyStats(db: IDBPDatabase): Promise<{
  wordsThisWeek: number;
  streak: number;
  totalLearned: number;
}> {
  const [allProgress, allSessions] = await Promise.all([
    getAllProgress(db as never),
    getAllSessions(db as never),
  ]);

  const totalLearned = allProgress.filter((p) => p.masteryLevel >= 1).length;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const wordsThisWeek = allProgress.filter(
    (p) => p.lastSeenAt && new Date(p.lastSeenAt) >= oneWeekAgo
  ).length;

  const sessionDates = new Set(
    allSessions.map((s) => formatDate(new Date(s.completedAt)))
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (sessionDates.has(formatDate(d))) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }

  return { wordsThisWeek, streak, totalLearned };
}

export async function recordSession(db: IDBPDatabase, session: Session): Promise<void> {
  await addSession(db as never, session);
}
