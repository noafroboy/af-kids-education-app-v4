import type { IDBPDatabase } from 'idb';
import { getAllProgress, addSession, getAllSessions } from './db';
import { formatDate } from './utils';
import type { Session, MasteryLevel, WordProgress } from '@/types';

type ProgressTx = {
  store: {
    get: (k: string) => Promise<WordProgress | undefined>;
    put: (v: WordProgress) => Promise<IDBValidKey>;
  };
  done: Promise<void>;
  abort: () => void;
};

export async function updateWordProgress(
  db: IDBPDatabase,
  wordId: string,
  wasCorrect: boolean
): Promise<void> {
  // Use a readwrite transaction to prevent interleaved reads/writes on rapid consecutive calls
  const dbAny = db as unknown as { transaction: (store: string, mode: string) => ProgressTx };
  const tx = dbAny.transaction('progress', 'readwrite');
  try {
    const existing = await tx.store.get(wordId);
    const now = new Date().toISOString();
    const seenCount = (existing?.seenCount ?? 0) + 1;
    const correctCount = (existing?.correctCount ?? 0) + (wasCorrect ? 1 : 0);

    let masteryLevel: MasteryLevel = existing?.masteryLevel ?? 0;
    if (masteryLevel === 0) masteryLevel = 1;
    if (masteryLevel === 1 && correctCount >= 3) masteryLevel = 2;
    if (masteryLevel === 2 && correctCount >= 8) masteryLevel = 3;

    await tx.store.put({
      wordId,
      seenCount,
      correctCount,
      masteryLevel,
      lastSeenAt: now,
    });
    await tx.done;
  } catch (err) {
    tx.abort();
    throw err;
  }
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

  const sessionDateList = allSessions.map((s) => formatDate(new Date(s.completedAt)));
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    if (sessionDateList.includes(formatDate(d))) {
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
