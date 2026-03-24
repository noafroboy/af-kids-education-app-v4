// For targeted regeneration of specific broken files, use generate-audio-zh-fix.ts instead
/**
 * Temporary fallback: generates Mandarin TTS using OpenAI nova voice.
 * Use this when GOOGLE_APPLICATION_CREDENTIALS is not available.
 * For production, run scripts/generate-audio-zh.ts with Google Cloud credentials
 * to get cmn-CN-Wavenet-A quality (better tonal accuracy).
 */
import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';
import pLimit from 'p-limit';
import { FULL_VOCABULARY } from './vocabulary-list';

const ZH_DIR = path.join(process.cwd(), 'public', 'audio', 'zh');
const FORCE = process.argv.includes('--force');

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY is not set');
    process.exit(1);
  }
  const client = new OpenAI({ apiKey });
  fs.mkdirSync(ZH_DIR, { recursive: true });

  const limit = pLimit(8);
  let generated = 0, skipped = 0, failed = 0;
  const total = FULL_VOCABULARY.length;

  await Promise.all(
    FULL_VOCABULARY.map((word, idx) =>
      limit(async () => {
        const slug = path.basename(word.audioZhPath, '.mp3');
        const outputPath = path.join(ZH_DIR, `${slug}.mp3`);
        const done = idx + 1;
        if (!FORCE && fs.existsSync(outputPath)) {
          console.log(`⏭️  [${done}/${total}] Skipped ZH ${word.englishWord} (exists)`);
          skipped++;
          return;
        }
        try {
          const response = await client.audio.speech.create({
            model: 'tts-1-hd',
            voice: 'nova',
            input: word.mandarinWord,
            speed: 0.85,
          });
          const buffer = Buffer.from(await response.arrayBuffer());
          if (buffer.length < 3 ||
            !(
              (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) ||
              (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xfa || buffer[1] === 0xf3))
            )
          ) {
            throw new Error(`Invalid MP3 header for "${word.englishWord}". First bytes: ${buffer.slice(0, 4).toString('hex')}`);
          }
          fs.writeFileSync(outputPath, buffer);
          console.log(`✅ [${done}/${total}] Generated ZH ${word.englishWord} (${word.mandarinWord})`);
          generated++;
        } catch (err) {
          console.error(`❌ [${done}/${total}] Failed ZH ${word.englishWord}:`, err);
          failed++;
        }
      })
    )
  );

  console.log(`\n✅ Generated: ${generated}  ⏭️ Skipped: ${skipped}  ❌ Failed: ${failed}`);
  console.log('\n⚠️  NOTE: These ZH files were generated with OpenAI TTS (nova).');
  console.log('   For better tonal accuracy, run scripts/generate-audio-zh.ts');
  console.log('   with GOOGLE_APPLICATION_CREDENTIALS set to use cmn-CN-Wavenet-A.');
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
