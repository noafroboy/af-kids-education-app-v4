import { openDB, type IDBPDatabase } from 'idb';
import type { VocabularyWord, WordProgress, Setting, Session, Song } from '@/types';
import { VOCABULARY_SEED } from './vocabulary-seed';
import { SONGS_SEED } from './songs-seed';

interface LittleBridgeDB {
  vocabulary: VocabularyWord;
  progress: WordProgress;
  settings: Setting;
  sessions: Session;
  songs: Song;
}

let dbPromise: Promise<IDBPDatabase<LittleBridgeDB>> | null = null;

export function getDB(): Promise<IDBPDatabase<LittleBridgeDB>> {
  if (!dbPromise) {
    dbPromise = openDB<LittleBridgeDB>('littlebridge', 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('vocabulary')) {
          const vocabStore = db.createObjectStore('vocabulary', { keyPath: 'id' });
          vocabStore.createIndex('category', 'category', { unique: false });
          for (const word of VOCABULARY_SEED) {
            vocabStore.add(word);
          }
        }
        if (!db.objectStoreNames.contains('progress')) {
          db.createObjectStore('progress', { keyPath: 'wordId' });
        }
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' });
        }
        if (!db.objectStoreNames.contains('sessions')) {
          db.createObjectStore('sessions', { keyPath: 'id', autoIncrement: true });
        }
        if (!db.objectStoreNames.contains('songs')) {
          const songsStore = db.createObjectStore('songs', { keyPath: 'id' });
          for (const song of SONGS_SEED) {
            songsStore.add(song);
          }
        }
      },
    });
  }
  return dbPromise;
}

export async function getWord(db: IDBPDatabase<LittleBridgeDB>, id: string): Promise<VocabularyWord | undefined> {
  return db.get('vocabulary', id);
}

export async function putWord(db: IDBPDatabase<LittleBridgeDB>, word: VocabularyWord): Promise<void> {
  await db.put('vocabulary', word);
}

export async function getAllWords(db: IDBPDatabase<LittleBridgeDB>): Promise<VocabularyWord[]> {
  return db.getAll('vocabulary');
}

export async function getWordsByCategory(db: IDBPDatabase<LittleBridgeDB>, category: string): Promise<VocabularyWord[]> {
  return db.getAllFromIndex('vocabulary', 'category', category);
}

export async function getProgress(db: IDBPDatabase<LittleBridgeDB>, wordId: string): Promise<WordProgress | undefined> {
  return db.get('progress', wordId);
}

export async function putProgress(db: IDBPDatabase<LittleBridgeDB>, progress: WordProgress): Promise<void> {
  await db.put('progress', progress);
}

export async function getAllProgress(db: IDBPDatabase<LittleBridgeDB>): Promise<WordProgress[]> {
  return db.getAll('progress');
}

export async function getSetting(db: IDBPDatabase<LittleBridgeDB>, key: string): Promise<Setting | undefined> {
  return db.get('settings', key);
}

export async function putSetting(db: IDBPDatabase<LittleBridgeDB>, key: string, value: unknown): Promise<void> {
  await db.put('settings', { key, value });
}

export async function addSession(db: IDBPDatabase<LittleBridgeDB>, session: Session): Promise<void> {
  await db.add('sessions', session);
}

export async function getAllSessions(db: IDBPDatabase<LittleBridgeDB>): Promise<Session[]> {
  return db.getAll('sessions');
}

export async function getAllSongs(db: IDBPDatabase<LittleBridgeDB>): Promise<Song[]> {
  return db.getAll('songs');
}

export async function putSong(db: IDBPDatabase<LittleBridgeDB>, song: Song): Promise<void> {
  await db.put('songs', song);
}

export async function clearProgress(db: IDBPDatabase<LittleBridgeDB>): Promise<void> {
  await db.clear('progress');
}

export async function clearSessions(db: IDBPDatabase<LittleBridgeDB>): Promise<void> {
  await db.clear('sessions');
}
