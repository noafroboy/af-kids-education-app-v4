import { test, expect } from '@playwright/test';
import { seedDB } from './helpers/seed-db';

/**
 * Guided session E2E test.
 * Seeds the DB so we skip onboarding and go straight to the home screen.
 */
test.beforeEach(async ({ page }) => {
  await seedDB(page);
});

test('guided session: greeting → mood → explore cards → celebration', async ({ page }) => {
  // 1. Navigate to home, verify home screen
  await page.goto('/');
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10_000 });

  // 2. Click Start Session button
  await page.getByTestId('start-session-btn').click();

  // 3. Session greeting step is visible
  await expect(page.getByTestId('session-greeting')).toBeVisible({ timeout: 8_000 });

  // 4. Click proceed button to skip the 3-second auto-advance
  await page.getByTestId('session-proceed-btn').click();

  // 5. Mood check is visible
  await expect(page.getByTestId('mood-check')).toBeVisible({ timeout: 5_000 });

  // 6. Select happy mood
  await page.getByTestId('mood-happy').click();

  // 7. Explore cards screen loads with vocabulary
  await expect(page.getByTestId('explore-cards')).toBeVisible({ timeout: 10_000 });

  // 8. Click Next Word 3 times to complete the 3-word set
  await expect(page.getByTestId('card-next-btn')).toBeVisible({ timeout: 5_000 });
  await page.getByTestId('card-next-btn').click();
  await page.getByTestId('card-next-btn').click();
  await page.getByTestId('card-next-btn').click();

  // 9. Celebration overlay appears
  await expect(page.getByTestId('celebration-overlay')).toBeVisible({ timeout: 8_000 });

  // 10. Overlay contains "learned" or "学了" text
  const celebrationText = await page.getByTestId('celebration-overlay').textContent();
  const hasLearned = celebrationText?.includes('learned') || celebrationText?.includes('学了');
  expect(hasLearned).toBeTruthy();
});
