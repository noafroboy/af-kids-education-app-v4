import type { Page } from '@playwright/test';

/**
 * Seeds the app's IndexedDB with test data.
 * MUST be called after the DB has been initialized (navigate to / first).
 *
 * Writes:
 *  - onboardingComplete = 'true'
 *  - childName = 'TestChild'
 *  - childAge = 3
 *  - pinHash = SHA-256('1234' + 'littlebridge-2026')
 *  - one dummy session (so streak-calendar is visible)
 */
export async function seedDB(page: Page): Promise<void> {
  // Navigate to / to trigger getDB() and initialize the object stores + vocabulary seed
  await page.goto('/');

  // Wait until the app settles: either onboarding-welcome (fresh DB) or home-screen (already seeded)
  await page.locator('[data-testid="onboarding-welcome"], [data-testid="home-screen"]').first().waitFor({
    state: 'visible',
    timeout: 15_000,
  });

  // Now write settings and a session directly into IndexedDB
  await page.evaluate(async () => {
    // Compute PIN hash for '1234' using the app's salt
    const encoder = new TextEncoder();
    const data = encoder.encode('1234' + 'littlebridge-2026');
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const pinHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    const db: IDBDatabase = await new Promise((resolve, reject) => {
      const req = indexedDB.open('littlebridge', 1);
      req.onsuccess = () => resolve(req.result as IDBDatabase);
      req.onerror = () => reject(req.error);
    });

    // Write settings
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('settings', 'readwrite');
      const store = tx.objectStore('settings');
      store.put({ key: 'onboardingComplete', value: 'true' });
      store.put({ key: 'childName', value: 'TestChild' });
      store.put({ key: 'childAge', value: 3 });
      store.put({ key: 'pinHash', value: pinHash });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Add a dummy completed session (so streak-calendar renders)
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('sessions', 'readwrite');
      const store = tx.objectStore('sessions');
      store.add({
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        activityType: 'explore',
        mood: null,
        wordIds: ['seed-word'],
        correctCount: 1,
        duration: 60,
      });
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    db.close();
  });
}
