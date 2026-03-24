'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useDB } from '@/hooks/useDB';
import { useParentAuth } from '@/hooks/useParentAuth';
import { getAllWords, getAllProgress, getAllSessions, getSetting } from '@/lib/db';
import { getWeeklyStats } from '@/lib/progress';
import { formatDate } from '@/lib/utils';
import { ParentLayout } from '@/components/layouts/ParentLayout';
import { StreakCalendar } from '@/components/ui/StreakCalendar';
import { WordListRow } from '@/components/ui/WordListRow';
import { WordDetailSheet } from '@/components/ui/WordDetailSheet';
import type { VocabularyWord, WordProgress, Session, Category } from '@/types';

const CATEGORIES: { key: 'all' | Category; labelZh: string }[] = [
  { key: 'all', labelZh: '全部' },
  { key: 'animals', labelZh: '动物' },
  { key: 'food', labelZh: '食物' },
  { key: 'colors', labelZh: '颜色' },
  { key: 'bodyParts', labelZh: '身体' },
  { key: 'family', labelZh: '家庭' },
  { key: 'objects', labelZh: '物体' },
  { key: 'actions', labelZh: '动作' },
];

export default function ParentDashboard() {
  const { isAuthed } = useParentAuth();
  const db = useDB();
  const [isLoading, setIsLoading] = useState(true);
  const [childName, setChildName] = useState('');
  const [words, setWords] = useState<VocabularyWord[]>([]);
  const [progressMap, setProgressMap] = useState<Map<string, WordProgress>>(new Map());
  const [sessions, setSessions] = useState<Session[]>([]);
  const [weeklyStats, setWeeklyStats] = useState({ wordsThisWeek: 0, streak: 0, totalLearned: 0 });
  const [activeCategory, setActiveCategory] = useState<'all' | Category>('all');
  const [selectedWord, setSelectedWord] = useState<VocabularyWord | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!db) return;
    (async () => {
      try {
        const [allWords, allProgress, allSessions, stats, nameSetting] = await Promise.all([
          getAllWords(db as never),
          getAllProgress(db as never),
          getAllSessions(db as never),
          getWeeklyStats(db as never),
          getSetting(db as never, 'childName'),
        ]);
        setWords(allWords);
        setProgressMap(new Map(allProgress.map((p) => [p.wordId, p])));
        setSessions(allSessions);
        setWeeklyStats(stats);
        setChildName(String(nameSetting?.value ?? ''));
      } catch (err) {
        console.error('[Dashboard] load error:', err);
        setError('Failed to load data / 加载失败');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [db]);

  const sessionDates = new Set(sessions.map((s) => formatDate(new Date(s.completedAt))));
  const filteredWords = activeCategory === 'all' ? words : words.filter((w) => w.category === activeCategory);
  const settingsLink = (
    <Link href="/parent/settings" className="text-white text-sm font-semibold px-2 py-2 min-h-[44px] flex items-center">
      Settings / 设置
    </Link>
  );

  if (!isAuthed) return null;

  if (isLoading) {
    return (
      <ParentLayout title={childName ? `${childName}'s Progress / ${childName}的进度` : 'Parent Dashboard / 家长面板'} rightSlot={settingsLink}>
        <div data-testid="parent-dashboard" className="p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-slate-200 rounded-xl animate-pulse" />
          ))}
        </div>
      </ParentLayout>
    );
  }

  if (error) {
    return (
      <ParentLayout title={childName ? `${childName}'s Progress / ${childName}的进度` : 'Parent Dashboard / 家长面板'} rightSlot={settingsLink}>
        <div data-testid="parent-dashboard" className="flex items-center justify-center min-h-[400px]">
          <p className="text-red-500">{error}</p>
        </div>
      </ParentLayout>
    );
  }

  return (
    <ParentLayout title={childName ? `${childName}'s Progress / ${childName}的进度` : 'Parent Dashboard / 家长面板'} rightSlot={settingsLink}>
      <div data-testid="parent-dashboard" className="p-4 space-y-4">
        {sessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-4">
            <span className="text-6xl">🐼</span>
            <p className="text-slate-600 text-center text-lg">
              还没有记录！快去玩吧！<br />
              <span className="text-base text-slate-400">No activity yet — start playing!</span>
            </p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-xl p-4 space-y-1">
              <p className="text-slate-700 font-semibold">
                本周: {weeklyStats.wordsThisWeek}个词 / This week: {weeklyStats.wordsThisWeek} words
              </p>
              <p className="text-slate-700">🔥 {weeklyStats.streak}天连续 / {weeklyStats.streak} day streak</p>
              <p className="text-slate-500 text-sm">Stage 1 / 第一阶段</p>
            </div>
            <div className="bg-white rounded-xl">
              <StreakCalendar sessionDates={sessionDates} />
            </div>
          </>
        )}

        <div className="flex gap-2 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex-shrink-0 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeCategory === cat.key
                  ? 'bg-[#FF6B35] text-white'
                  : 'bg-white text-slate-600 border border-slate-200'
              }`}
            >
              {cat.labelZh}
            </button>
          ))}
        </div>

        <div data-testid="word-list" className="space-y-2">
          {filteredWords.map((word) => (
            <WordListRow
              key={word.id}
              word={word}
              progress={progressMap.get(word.id) ?? null}
              onClick={() => setSelectedWord(word)}
            />
          ))}
        </div>
      </div>

      {selectedWord && (
        <WordDetailSheet
          word={selectedWord}
          progress={progressMap.get(selectedWord.id) ?? null}
          onClose={() => setSelectedWord(null)}
        />
      )}
    </ParentLayout>
  );
}
