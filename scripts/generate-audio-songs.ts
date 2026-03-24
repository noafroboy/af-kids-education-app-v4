// Generates song audio files for the Song Time activity.
import OpenAI from 'openai';
import * as fs from 'fs';
import * as path from 'path';

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

const SONGS_DIR = path.join(process.cwd(), 'public', 'audio', 'songs');

interface Song {
  filename: string;
  lyrics: string;
}

const SONGS: Song[] = [
  {
    filename: 'twinkle.mp3',
    lyrics:
      'Twinkle twinkle little star, how I wonder what you are. Up above the world so high, like a diamond in the sky. Twinkle twinkle little star, how I wonder what you are. 一闪一闪亮晶晶，满天都是小星星。',
  },
  {
    filename: 'old-macdonald.mp3',
    lyrics:
      'Old MacDonald had a farm, E-I-E-I-O! And on his farm he had a cow, E-I-E-I-O! With a moo moo here and a moo moo there, here a moo, there a moo, everywhere a moo moo. Old MacDonald had a farm, E-I-E-I-O!',
  },
  {
    filename: 'head-shoulders.mp3',
    lyrics:
      'Head, shoulders, knees and toes, knees and toes! Head, shoulders, knees and toes, knees and toes! And eyes and ears and mouth and nose. Head, shoulders, knees and toes, knees and toes! 头，肩膀，膝盖，脚，膝盖，脚！',
  },
];

function isValidMp3(buffer: Buffer): boolean {
  if (buffer.length < 3) return false;
  // ID3 tag header
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) return true;
  // Raw MP3 sync bytes
  if (buffer[0] === 0xff && (buffer[1] === 0xfb || buffer[1] === 0xfa || buffer[1] === 0xf3)) return true;
  return false;
}

async function generateSong(song: Song): Promise<void> {
  const outputPath = path.join(SONGS_DIR, song.filename);

  // Skip if exists and valid
  if (fs.existsSync(outputPath)) {
    const existing = fs.readFileSync(outputPath);
    if (isValidMp3(existing)) {
      console.log(`⏭️  Skipped ${song.filename} (exists, valid MP3)`);
      return;
    }
    console.log(`⚠️  ${song.filename} exists but failed MP3 validation — regenerating...`);
  }

  console.log(`Generating song: ${song.filename}...`);

  const response = await client.audio.speech.create({
    model: 'tts-1-hd',
    voice: 'nova',
    input: song.lyrics,
    speed: 0.9,
  });

  const buffer = Buffer.from(await response.arrayBuffer());

  if (!isValidMp3(buffer)) {
    throw new Error(
      `Invalid MP3 header for "${song.filename}". ` +
        `First bytes: ${buffer.slice(0, 4).toString('hex')}`
    );
  }

  fs.writeFileSync(outputPath, buffer);
  console.log(`✅ ${song.filename} (${buffer.length} bytes, valid MP3)`);
}

async function main(): Promise<void> {
  fs.mkdirSync(SONGS_DIR, { recursive: true });

  let succeeded = 0;
  let failed = 0;

  for (const song of SONGS) {
    try {
      await generateSong(song);
      succeeded++;
    } catch (err) {
      console.error(`❌ Failed to generate "${song.filename}":`, err);
      failed++;
    }
  }

  console.log(`\n✅ Succeeded: ${succeeded}  ❌ Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
