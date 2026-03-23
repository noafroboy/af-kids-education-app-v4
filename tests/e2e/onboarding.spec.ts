import { test, expect } from '@playwright/test';

/**
 * Onboarding E2E test.
 * Uses a fresh IndexedDB (no seed) to verify the full onboarding flow
 * and that IndexedDB persists data across page reload.
 */
test('onboarding flow → home screen → persistence across reload', async ({ page }) => {
  // 1. Navigate to / — fresh DB should redirect to /onboarding
  await page.goto('/');
  await expect(page).toHaveURL(/\/onboarding/, { timeout: 10_000 });

  // 2. Welcome screen is visible
  await expect(page.getByTestId('onboarding-welcome')).toBeVisible();

  // 3. Click Get Started / 开始 button
  await page.getByTestId('onboarding-start').click();

  // 4. Name step: fill in child's name and advance
  await expect(page.locator('[name="childName"]')).toBeVisible({ timeout: 5_000 });
  await page.fill('[name="childName"]', 'TestChild');
  await page.getByTestId('onboarding-next').click();

  // 5. Age step: select age 3 and advance
  await expect(page.getByTestId('age-option-3')).toBeVisible({ timeout: 5_000 });
  await page.getByTestId('age-option-3').click();
  await page.getByTestId('onboarding-next').click();

  // 6. PIN step: enter digits 1, 2, 3, 4 (PinPad auto-submits after 4th)
  await expect(page.getByTestId('pin-key-1')).toBeVisible({ timeout: 5_000 });
  await page.getByTestId('pin-key-1').click();
  await page.getByTestId('pin-key-2').click();
  await page.getByTestId('pin-key-3').click();
  await page.getByTestId('pin-key-4').click();

  // 7. Handoff step: onboarding-done button appears after PIN hashing
  await expect(page.getByTestId('onboarding-done')).toBeVisible({ timeout: 8_000 });
  await page.getByTestId('onboarding-done').click();

  // 8. Home screen appears with child's name
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('TestChild')).toBeVisible();

  // 9. Reload the page — IndexedDB persists, home screen should still appear
  await page.reload();
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText('TestChild')).toBeVisible();
});
