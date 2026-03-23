import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import pLimit from 'p-limit';
import { FULL_VOCABULARY } from './vocabulary-list';

const EN_DIR = path.join(process.cwd(), 'public', 'audio', 'en');
const SFX_DIR = path.join(process.cwd(), 'public', 'audio', 'sfx');

const SFX_FILES = [
  { slug: 'correct', text: 'Correct! Great job!' },
  { slug: 'incorrect', text: 'Oops, try again!' },
  { slug: 'celebration', text: 'Hooray! You did it!' },
  { slug: 'whoosh', text: 'Whoosh!' },
  { slug: 'card-flip', text: 'Flip!' },
  { slug: 'tap', text: 'Tap!' },
];

interface GenerateOptions {
  force?: boolean;
  wordSlug?: string;
}

interface BatchResult {
  generated: number;
  skipped: number;
  failed: number;
}

function slugFromAudioPath(audioPath: string): string {
  return path.basename(audioPath, '.mp3');
}

async function generateTts(
  client: OpenAI,
  text: string,
  outputPath: string
): Promise<void> {
  const response = await client.audio.speech.create({
    model: 'tts-1',
    voice: 'nova',
    input: text,
    speed: 0.85,
  });
  const buffer = Buffer.from(await response.arrayBuffer());
  fs.writeFileSync(outputPath, buffer);
}

export async function generateAudioEn(options: GenerateOptions = {}): Promise<BatchResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY environment variable is not set.');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });
  fs.mkdirSync(EN_DIR, { recursive: true });
  fs.mkdirSync(SFX_DIR, { recursive: true });

  const result: BatchResult = { generated: 0, skipped: 0, failed: 0 };
  const limit = pLimit(8);

  // Generate vocabulary EN audio
  let wordsToProcess = FULL_VOCABULARY;
  if (options.wordSlug) {
    wordsToProcess = FULL_VOCABULARY.filter(
      (w) => slugFromAudioPath(w.audioEnPath) === options.wordSlug
    );
    if (wordsToProcess.length === 0) {
      console.error(`❌ No word found with slug "${options.wordSlug}"`);
      process.exit(1);
    }
  }

  const total = wordsToProcess.length;
  await Promise.all(
    wordsToProcess.map((word, idx) =>
      limit(async () => {
        const slug = slugFromAudioPath(word.audioEnPath);
        const outputPath = path.join(EN_DIR, `${slug}.mp3`);
        const done = idx + 1;

        if (!options.force && fs.existsSync(outputPath)) {
          console.log(`⏭️  [${done}/${total}] Skipped EN ${word.englishWord} (exists)`);
          result.skipped++;
          return;
        }

        try {
          await generateTts(client, word.englishWord, outputPath);
          console.log(`✅ [${done}/${total}] Generated EN ${word.englishWord}`);
          result.generated++;
        } catch (err) {
          console.error(`❌ [${done}/${total}] Failed EN ${word.englishWord}:`, err);
          result.failed++;
        }
      })
    )
  );

  // Generate SFX files
  for (const sfx of SFX_FILES) {
    const outputPath = path.join(SFX_DIR, `${sfx.slug}.mp3`);
    if (!options.force && fs.existsSync(outputPath)) {
      console.log(`⏭️  Skipped SFX ${sfx.slug} (exists)`);
      result.skipped++;
      continue;
    }
    try {
      await generateTts(client, sfx.text, outputPath);
      console.log(`✅ Generated SFX ${sfx.slug}`);
      result.generated++;
    } catch (err) {
      console.error(`❌ Failed SFX ${sfx.slug}:`, err);
      result.failed++;
    }
  }

  return result;
}

// Allow running directly
if (process.argv[1] && process.argv[1].endsWith('generate-audio-en.ts')) {
  const force = process.argv.includes('--force');
  const wordIdx = process.argv.indexOf('--word');
  const wordSlug = wordIdx !== -1 ? process.argv[wordIdx + 1] : undefined;

  generateAudioEn({ force, wordSlug })
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
