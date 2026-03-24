import { test, expect } from '@playwright/test';
import { seedDB } from './helpers/seed-db';

/**
 * Free-play activities E2E tests.
 * Verifies all 4 activity routes navigate and render correctly.
 */
test.beforeEach(async ({ page }) => {
  await seedDB(page);
});

test('explore cards activity renders vocabulary card with audio button', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10_000 });

  // Navigate to Explore Cards
  await page.getByTestId('activity-explore-cards').click();
  await expect(page.getByTestId('explore-cards')).toBeVisible({ timeout: 10_000 });

  // Vocabulary card is visible
  await expect(page.getByTestId('vocab-card').first()).toBeVisible({ timeout: 5_000 });

  // Click the first vocab card (plays audio)
  await page.getByTestId('vocab-card').first().click();

  // Audio button remains visible on the card
  await expect(page.getByTestId('audio-button').first()).toBeVisible();
});

test('matching pairs activity renders game board', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10_000 });

  await page.getByTestId('activity-matching-pairs').click();
  await expect(page.getByTestId('matching-pairs')).toBeVisible({ timeout: 10_000 });
});

test('listen and find activity renders choice cards', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10_000 });

  await page.getByTestId('activity-listen-find').click();
  await expect(page.getByTestId('listen-and-find')).toBeVisible({ timeout: 10_000 });
});

test('song time activity renders song picker', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10_000 });

  await page.getByTestId('activity-song-time').click();
  await expect(page.getByTestId('song-time')).toBeVisible({ timeout: 10_000 });
});
