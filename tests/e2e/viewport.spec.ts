import { test, expect } from '@playwright/test';

test('viewport is 375×667 (mobile target, not Desktop Chrome override)', async ({ page }) => {
  await page.goto('/');
  const viewport = page.viewportSize();
  expect(viewport).toEqual({ width: 375, height: 667 });
});
