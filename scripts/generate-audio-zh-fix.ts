// For targeted regeneration of specific broken files, use this script.
// This force-regenerates 13 broken/missing Mandarin audio files.
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';
import pLimit from 'p-limit';
import { FULL_VOCABULARY } from './vocabulary-list';

// Inline fallback Mandarin words for vocabulary entries not in FULL_VOCABULARY
const INLINE_MANDARIN: Record<string, string> = {
  lion: '狮子',
  bear: '熊',
  grape: '葡萄',
};

function readEnvLocal(key: string): string | undefined {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) return undefined;
  const content = fs.readFileSync(envPath, 'utf-8');
  const match = content.match(new RegExp(`^${key}=(.+)$`, 'm'));
  return match ? match[1].trim().replace(/^["']|["']$/g, '') : undefined;
}

const apiKey = process.env.OPENAI_API_KEY || readEnvLocal('OPENAI_API_KEY');

if (!apiKey) {
  console.error('❌ OPENAI_API_KEY is not set. Set it in the environment or .env.local file.');
  process.exit(1);
}

const client = new OpenAI({ apiKey });

const TARGET_WORDS = [
  'apple', 'cat', 'dog', 'rabbit', 'fish', 'bird',
  'milk', 'rice', 'egg', 'banana', 'lion', 'bear', 'grape',
];

const ZH_DIR = path.join(process.cwd(), 'public', 'audio', 'zh');

function isValidMp3(buffer: Buffer): boolean {
  if (buffer.length < 3) return false;
  // ID3 tag header
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
  // Raw MP3 sync bytes
  if (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xfa || buffer[1] === 0xf3)) return true;
  return false;
}

async function generateZhAudio(englishWord: string): Promise<void> {
  const vocabEntry = FULL_VOCABULARY.find(
    (w) => w.englishWord.toLowerCase() === englishWord.toLowerCase()
  );

  const mandarinWord = vocabEntry?.mandarinWord ?? INLINE_MANDARIN[englishWord.toLowerCase()];
  if (!mandarinWord) {
    throw new Error(`Word not found in VOCABULARY or inline fallback: ${englishWord}`);
  }

  const outputPath = path.join(ZH_DIR, `${englishWord.toLowerCase()}.mp3`);

  console.log(`Generating ZH audio for: ${englishWord} (${mandarinWord})...`);

  const response = await client.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'nova',
    input: mandarinWord,
    speed: 0.85,
  });

  const buffer = Buffer.from(await response.arrayBuffer());

  if (!isValidMp3(buffer)) {
    throw new Error(
      `Invalid MP3 header for "${englishWord}" (${mandarinWord}). ` +
        `First bytes: ${buffer.slice(0, 4).toString('hex')}`
    );
  }

  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ ${englishWord.toLowerCase()}.mp3 (${buffer.length} bytes, valid MP3)`);
}

async function main(): Promise<void> {
  fs.mkdirSync(ZH_DIR, { recursive: true });

  const limit = pLimit(3);
  let succeeded = 0;
  let failed = 0;

  await Promise.all(
    TARGET_WORDS.map((word) =>
      limit(async () => {
        try {
          await generateZhAudio(word);
          succeeded++;
        } catch (err) {
          console.error(`❌ Failed to generate ZH audio for "${word}":`, err);
          failed++;
        }
      })
    )
  );

  console.log(`\n✅ Succeeded: ${succeeded}  ❌ Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
