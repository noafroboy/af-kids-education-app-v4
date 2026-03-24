import { test, expect } from '@playwright/test';
import { seedDB } from './helpers/seed-db';

/**
 * Parent dashboard E2E test.
 * Verifies PIN gate (wrong PIN shows error, correct PIN grants access)
 * and dashboard content (streak calendar, word list, word detail sheet).
 */
test.beforeEach(async ({ page }) => {
  await seedDB(page);
});

test('direct navigation to /parent/dashboard redirects to PIN page', async ({ page }) => {
  // Navigate directly to dashboard without any prior PIN authentication
  await page.goto('/parent/dashboard');

  // Should be redirected to the PIN gate
  await expect(page.getByTestId('parent-pin-page')).toBeVisible({ timeout: 5000 });

  // Dashboard content should NOT be visible
  await expect(page.getByTestId('parent-dashboard')).not.toBeVisible();
});

test('parent dashboard: wrong PIN → error, correct PIN → dashboard + streak + word detail', async ({ page }) => {
  // 1. Navigate to parent page
  await page.goto('/parent');

  // 2. PIN pad is visible (requires data-testid="pin-pad" on PinPad outer div)
  await expect(page.getByTestId('pin-pad')).toBeVisible({ timeout: 8_000 });

  // 3. Enter wrong PIN: 5-5-5-5
  await page.getByTestId('pin-key-5').click();
  await page.getByTestId('pin-key-5').click();
  await page.getByTestId('pin-key-5').click();
  await page.getByTestId('pin-key-5').click();

  // 4. Error message appears (wrong PIN attempt 1/3)
  await expect(page.getByText('Wrong PIN (1/3)')).toBeVisible({ timeout: 3_000 });

  // 5. Enter another wrong PIN: 6-6-6-6
  await page.getByTestId('pin-key-6').click();
  await page.getByTestId('pin-key-6').click();
  await page.getByTestId('pin-key-6').click();
  await page.getByTestId('pin-key-6').click();

  // Wait for error text to update to attempt 2/3 — this ensures the 6666 submission
  // has been processed and setDigits([]) has run before we enter the correct PIN
  await expect(page.getByText('Wrong PIN (2/3)')).toBeVisible({ timeout: 3_000 });

  // Allow time for PinPad state (digits) to fully clear after the 6666 submission
  await page.waitForTimeout(300);

  // 6. Enter correct PIN: 1-2-3-4
  await page.getByTestId('pin-key-1').click();
  await page.getByTestId('pin-key-2').click();
  await page.getByTestId('pin-key-3').click();
  await page.getByTestId('pin-key-4').click();

  // 7. Parent dashboard is visible
  await expect(page).toHaveURL(/\/parent\/dashboard/, { timeout: 8_000 });
  await expect(page.getByTestId('parent-dashboard')).toBeVisible({ timeout: 8_000 });

  // 8. Streak calendar is visible (DB was seeded with a session)
  await expect(page.getByTestId('streak-calendar')).toBeVisible({ timeout: 5_000 });

  // 9. Click the first word row to open detail sheet
  await expect(page.getByTestId('word-row').first()).toBeVisible({ timeout: 5_000 });
  await page.getByTestId('word-row').first().click();

  // 10. Word detail sheet is visible
  await expect(page.getByTestId('word-detail-sheet')).toBeVisible({ timeout: 5_000 });
});
