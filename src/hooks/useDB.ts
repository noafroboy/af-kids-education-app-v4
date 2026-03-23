'use client';

import { useEffect, useState } from 'react';
import type { IDBPDatabase } from 'idb';
import { getDB } from '@/lib/db';

let singletonDb: IDBPDatabase | null = null;

export function useDB(): IDBPDatabase | null {
  const [db, setDb] = useState<IDBPDatabase | null>(singletonDb);

  useEffect(() => {
    if (singletonDb) {
      setDb(singletonDb);
      return;
    }
    getDB()
      .then((instance) => {
        singletonDb = instance as IDBPDatabase;
        setDb(singletonDb);
      })
      .catch((err) => {
        console.warn('[useDB] Failed to open IndexedDB:', err);
      });
  }, []);

  return db;
}
