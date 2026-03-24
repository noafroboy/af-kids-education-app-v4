'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export function useParentAuth() {
  const router = useRouter();
  const [isAuthed, setIsAuthed] = useState(false);

  useEffect(() => {
    const authed = sessionStorage.getItem('parentAuthed') === '1';
    if (!authed) {
      router.replace('/parent');
    } else {
      setIsAuthed(true);
    }
  }, [router]);

  return { isAuthed };
}
