import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import sharp from 'sharp';
import pLimit from 'p-limit';
import { FULL_VOCABULARY } from './vocabulary-list';

const OUTPUT_DIR = path.join(process.cwd(), 'public', 'images', 'vocabulary');
const PLACEHOLDER_PATH = path.join(process.cwd(), 'public', 'images', 'placeholder.png');
const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 12000;
const MAX_RETRIES = 3;

interface GenerateOptions {
  force?: boolean;
  wordSlug?: string;
}

interface BatchResult {
  generated: number;
  skipped: number;
  failed: number;
}

function slugFromImagePath(imagePath: string): string {
  return path.basename(imagePath, '.png');
}

function buildPrompt(englishWord: string): string {
  return (
    `Kawaii toddler flashcard illustration of ${englishWord}, ` +
    'white background, warm pastel colors, thick simple black outlines, ' +
    'cute friendly style, flat 2D digital art, no text or letters, no shadows, ' +
    'suitable for ages 2-5 educational app, joyful expression if living thing, ' +
    '512x512 art style'
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function downloadAndResize(url: string, outputPath: string): Promise<void> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  await sharp(buffer).resize(512, 512).png().toFile(outputPath);
}

async function generateImageWithRetry(
  client: OpenAI,
  englishWord: string,
  outputPath: string,
  retries = MAX_RETRIES
): Promise<void> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await client.images.generate({
        model: 'dall-e-3',
        prompt: buildPrompt(englishWord),
        n: 1,
        size: '1024x1024',
        quality: 'standard',
        response_format: 'url',
      });
      const url = (response.data ?? [])[0]?.url;
      if (!url) throw new Error('No URL returned from DALL-E 3');
      await downloadAndResize(url, outputPath);
      return;
    } catch (err: unknown) {
      const isRetryable =
        err instanceof Error &&
        (err.message.includes('429') || err.message.includes('500') || err.message.includes('rate'));
      if (attempt < retries && isRetryable) {
        const delay = Math.pow(2, attempt) * 1000;
        console.error(`  ⚠️  Attempt ${attempt} failed for "${englishWord}", retrying in ${delay}ms…`);
        await sleep(delay);
      } else if (attempt === retries) {
        throw err;
      }
    }
  }
}

async function generatePlaceholder(force = false): Promise<void> {
  if (!force && fs.existsSync(PLACEHOLDER_PATH)) {
    const stat = fs.statSync(PLACEHOLDER_PATH);
    if (stat.size > 100) {
      console.log('⏭️  Skipped placeholder.png (exists)');
      return;
    }
  }
  await sharp({
    create: { width: 512, height: 512, channels: 4, background: { r: 199, g: 184, b: 234, alpha: 1 } },
  })
    .png()
    .toFile(PLACEHOLDER_PATH);
  console.log('✅ Generated placeholder.png');
}

export async function generateImages(options: GenerateOptions = {}): Promise<BatchResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is not set.');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });

  await generatePlaceholder(options.force);

  let wordsToProcess = FULL_VOCABULARY;
  if (options.wordSlug) {
    wordsToProcess = FULL_VOCABULARY.filter(
      (w) => slugFromImagePath(w.imagePath) === options.wordSlug
    );
    if (wordsToProcess.length === 0) {
      console.error(`❌ No word found with slug "${options.wordSlug}"`);
      process.exit(1);
    }
  }

  const result: BatchResult = { generated: 0, skipped: 0, failed: 0 };
  const limit = pLimit(BATCH_SIZE);
  const total = wordsToProcess.length;

  for (let i = 0; i < wordsToProcess.length; i += BATCH_SIZE) {
    const batch = wordsToProcess.slice(i, i + BATCH_SIZE);
    const batchStart = Date.now();

    await Promise.all(
      batch.map((word) =>
        limit(async () => {
          const slug = slugFromImagePath(word.imagePath);
          const outputPath = path.join(OUTPUT_DIR, `${slug}.png`);
          const done = result.generated + result.skipped + result.failed + 1;

          if (!options.force && fs.existsSync(outputPath)) {
            console.log(`⏭️  [${done}/${total}] Skipped ${word.englishWord} (exists)`);
            result.skipped++;
            return;
          }

          try {
            await generateImageWithRetry(client, word.englishWord, outputPath);
            console.log(`✅ [${done}/${total}] Generated ${word.englishWord}`);
            result.generated++;
          } catch (err) {
            console.error(`❌ [${done}/${total}] Failed ${word.englishWord}:`, err);
            result.failed++;
          }
        })
      )
    );

    const elapsed = Date.now() - batchStart;
    const remaining = wordsToProcess.length - i - BATCH_SIZE;
    if (remaining > 0) {
      const wait = Math.max(0, BATCH_DELAY_MS - elapsed);
      if (wait > 0) {
        console.log(`⏳ Rate limit pause: ${wait}ms before next batch…`);
        await sleep(wait);
      }
    }
  }

  return result;
}

// Allow running directly
if (process.argv[1] && process.argv[1].endsWith('generate-images.ts')) {
  const force = process.argv.includes('--force');
  const wordIdx = process.argv.indexOf('--word');
  const wordSlug = wordIdx !== -1 ? process.argv[wordIdx + 1] : undefined;

  generateImages({ force, wordSlug })
    .then((r) => {
      console.log(
        `\n✅ Generated: ${r.generated}  ⏭️ Skipped: ${r.skipped}  ❌ Failed: ${r.failed}`
      );
    })
    .catch((err) => {
      console.error('Fatal error:', err);
      process.exit(1);
    });
}
