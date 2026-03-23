import fs from 'fs';
import path from 'path';
import TextToSpeech from '@google-cloud/text-to-speech';
import pLimit from 'p-limit';
import { FULL_VOCABULARY } from './vocabulary-list';

const ZH_DIR = path.join(process.cwd(), 'public', 'audio', 'zh');

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

function validateGoogleCredentials(): void {
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS ?? process.env.GOOGLE_CLOUD_KEY_FILE;
  if (!credPath) {
    console.error(
      '❌ GOOGLE_APPLICATION_CREDENTIALS (or GOOGLE_CLOUD_KEY_FILE) environment variable is not set.\n' +
        '   Set it to the path of your Google Cloud service account JSON file.\n' +
        '   Example: export GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json'
    );
    process.exit(1);
  }
  if (!fs.existsSync(credPath)) {
    console.error(`❌ Google Cloud credentials file not found: ${credPath}`);
    process.exit(1);
  }
  // Ensure the env var is set for the client library
  process.env.GOOGLE_APPLICATION_CREDENTIALS = credPath;
}

export async function generateAudioZh(options: GenerateOptions = {}): Promise<BatchResult> {
  validateGoogleCredentials();

  const client = new TextToSpeech.TextToSpeechClient();
  fs.mkdirSync(ZH_DIR, { recursive: true });

  const result: BatchResult = { generated: 0, skipped: 0, failed: 0 };
  const limit = pLimit(10);

  let wordsToProcess = FULL_VOCABULARY;
  if (options.wordSlug) {
    wordsToProcess = FULL_VOCABULARY.filter(
      (w) => slugFromAudioPath(w.audioZhPath) === options.wordSlug
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
        const slug = slugFromAudioPath(word.audioZhPath);
        const outputPath = path.join(ZH_DIR, `${slug}.mp3`);
        const done = idx + 1;

        if (!options.force && fs.existsSync(outputPath)) {
          console.log(`⏭️  [${done}/${total}] Skipped ZH ${word.englishWord} (exists)`);
          result.skipped++;
          return;
        }

        try {
          const [response] = await client.synthesizeSpeech({
            input: { text: word.mandarinWord },
            voice: {
              languageCode: 'cmn-CN',
              name: 'cmn-CN-Wavenet-A',
            },
            audioConfig: {
              audioEncoding: 'MP3' as const,
              speakingRate: 0.85,
            },
          });

          if (!response.audioContent) {
            throw new Error('No audio content returned');
          }

          const audioBuffer =
            response.audioContent instanceof Uint8Array
              ? Buffer.from(response.audioContent)
              : Buffer.from(response.audioContent as string, 'base64');

          fs.writeFileSync(outputPath, audioBuffer);
          console.log(`✅ [${done}/${total}] Generated ZH ${word.englishWord} (${word.mandarinWord})`);
          result.generated++;
        } catch (err) {
          console.error(`❌ [${done}/${total}] Failed ZH ${word.englishWord}:`, err);
          result.failed++;
        }
      })
    )
  );

  return result;
}

// Allow running directly
if (process.argv[1] && process.argv[1].endsWith('generate-audio-zh.ts')) {
  const force = process.argv.includes('--force');
  const wordIdx = process.argv.indexOf('--word');
  const wordSlug = wordIdx !== -1 ? process.argv[wordIdx + 1] : undefined;

  generateAudioZh({ force, wordSlug })
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
