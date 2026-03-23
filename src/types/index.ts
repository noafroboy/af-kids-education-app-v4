export type Category = 'animals' | 'food' | 'colors' | 'bodyParts' | 'family' | 'objects' | 'actions';
export type ActivityType = 'explore' | 'listenFind' | 'matchingPairs' | 'songTime' | 'guidedSession';
export type MasteryLevel = 0 | 1 | 2 | 3;
export type MoodType = 'happy' | 'okay' | 'tired';

export interface VocabularyWord {
  id: string;
  englishWord: string;
  mandarinWord: string;
  pinyin: string;
  category: Category;
  imagePath: string;
  audioEnPath: string;
  audioZhPath: string;
  tags: string[];
}

export interface WordProgress {
  wordId: string;
  seenCount: number;
  correctCount: number;
  masteryLevel: MasteryLevel;
  lastSeenAt: string;
}

export interface Setting {
  key: string;
  value: unknown;
}

export interface LyricLine {
  text: string;
  textZh: string;
  startMs: number;
  endMs: number;
  highlightWordIds: string[];
}

export interface Song {
  id: string;
  title: string;
  titleZh: string;
  audioPath: string;
  coverImagePath: string;
  lyrics: LyricLine[];
  playCount?: number;
}

export interface Session {
  id?: number;
  startedAt: string;
  completedAt: string;
  activityType: ActivityType;
  mood: MoodType | null;
  wordIds: string[];
  correctCount: number;
  duration: number;
}
