import { test, expect } from '@playwright/test';
import { seedDB } from './helpers/seed-db';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '../../');

// ── Helpers ────────────────────────────────────────────────────────────────────

function getAllFilesRecursive(dir: string, ext: string[]): string[] {
  const results: string[] = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...getAllFilesRecursive(fullPath, ext));
    } else if (ext.some((e) => entry.name.endsWith(e))) {
      results.push(fullPath);
    }
  }
  return results;
}

function countLines(filePath: string): number {
  return fs.readFileSync(filePath, 'utf-8').split('\n').length;
}

// ── Static code checks (no browser needed) ────────────────────────────────────

test('no hardcoded API keys in src/', () => {
  const srcDir = path.join(PROJECT_ROOT, 'src');
  const files = getAllFilesRecursive(srcDir, ['.ts', '.tsx', '.js', '.jsx']);

  const violations: string[] = [];
  const PATTERNS = ['OPENAI_API_KEY', 'GOOGLE_APPLICATION_CREDENTIALS'];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf-8');
    const lines = content.split('\n');
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const pattern of PATTERNS) {
        // Fail only if the string appears WITHOUT being a process.env reference
        if (line.includes(pattern) && !line.includes('process.env')) {
          violations.push(`${path.relative(PROJECT_ROOT, file)}:${i + 1}: ${line.trim()}`);
        }
      }
    }
  }

  if (violations.length > 0) {
    throw new Error(`Hardcoded API key references found:\n${violations.join('\n')}`);
  }
});

test('no component file in src/components/ exceeds 200 lines', () => {
  const componentsDir = path.join(PROJECT_ROOT, 'src', 'components');
  const files = getAllFilesRecursive(componentsDir, ['.tsx', '.ts']);

  const oversized: string[] = [];
  for (const file of files) {
    const lineCount = countLines(file);
    if (lineCount > 200) {
      oversized.push(`${path.relative(PROJECT_ROOT, file)}: ${lineCount} lines`);
    }
  }

  if (oversized.length > 0) {
    throw new Error(`Component files exceeding 200 lines:\n${oversized.join('\n')}`);
  }
});

// ── Browser-based checks (each test seeds its own DB) ─────────────────────────

const ACTIVITY_ROUTES = [
  { url: '/activities/explore-cards', testId: 'explore-cards' },
  { url: '/activities/listen-find', testId: 'listen-and-find' },
  { url: '/activities/matching-pairs', testId: 'matching-pairs' },
  { url: '/activities/song-time', testId: 'song-time' },
];

for (const { url, testId } of ACTIVITY_ROUTES) {
  test(`activity route ${url} renders non-empty content`, async ({ page }) => {
    await seedDB(page);
    await page.goto(url);
    const container = page.getByTestId(testId);
    await expect(container).toBeVisible({ timeout: 12_000 });
    const text = await container.textContent();
    expect(text?.trim().length).toBeGreaterThan(0);
  });
}

test('audio buttons have non-empty aria-label', async ({ page }) => {
  await seedDB(page);
  await page.goto('/activities/explore-cards');
  await expect(page.getByTestId('explore-cards')).toBeVisible({ timeout: 12_000 });

  const audioButtons = page.getByTestId('audio-button');
  const count = await audioButtons.count();
  expect(count).toBeGreaterThan(0);

  for (let i = 0; i < count; i++) {
    const label = await audioButtons.nth(i).getAttribute('aria-label');
    expect(label).toBeTruthy();
    expect(label!.length).toBeGreaterThan(0);
  }
});

test('HomeScreen interactive elements measure ≥88px height', async ({ page }) => {
  await seedDB(page);
  await page.goto('/');
  await expect(page.getByTestId('home-screen')).toBeVisible({ timeout: 10_000 });

  const targets = ['start-session-btn', 'parent-icon', 'activity-explore-cards'];

  for (const testId of targets) {
    const el = page.getByTestId(testId);
    await expect(el).toBeVisible();

    const rect = await el.evaluate((node) => {
      const { width, height } = node.getBoundingClientRect();
      return { width, height };
    });

    expect(rect.height).toBeGreaterThanOrEqual(88);
    expect(rect.width).toBeGreaterThanOrEqual(88);
  }
});
