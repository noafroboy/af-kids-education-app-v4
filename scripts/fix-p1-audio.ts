/**
 * fix-p1-audio.ts
 *
 * Fixes three P1 audio issues found in integration review:
 *  1. 20 corrupted Mandarin TTS files (443-byte OpenAI error JSON responses)
 *  2. Missing greeting audio: /audio/en/lets-learn.mp3
 *  3. Missing song audio files: /audio/songs/{twinkle,old-macdonald,head-shoulders}.mp3
 *
 * Uses OpenAI TTS (nova voice, speed 0.85) — consistent with existing EN audio.
 * Run: OPENAI_API_KEY=... tsx scripts/fix-p1-audio.ts
 */

import fs from 'fs';
import path from 'path';
import OpenAI from 'openai';

const ZH_DIR = path.join(process.cwd(), 'public', 'audio', 'zh');
const EN_DIR = path.join(process.cwd(), 'public', 'audio', 'en');
const SONGS_DIR = path.join(process.cwd(), 'public', 'audio', 'songs');

// ── 20 corrupted Mandarin files (confirmed 443-byte JSON error stubs) ────────
const CORRUPTED_ZH_FILES: Array<{ slug: string; text: string }> = [
  { slug: 'apple',  text: '苹果' },
  { slug: 'banana', text: '香蕉' },
  { slug: 'bird',   text: '鸟' },
  { slug: 'blue',   text: '蓝色' },
  { slug: 'cat',    text: '猫' },
  { slug: 'dog',    text: '狗' },
  { slug: 'egg',    text: '鸡蛋' },
  { slug: 'eyes',   text: '眼睛' },
  { slug: 'fish',   text: '鱼' },
  { slug: 'foot',   text: '脚' },
  { slug: 'green',  text: '绿色' },
  { slug: 'hand',   text: '手' },
  { slug: 'milk',   text: '牛奶' },
  { slug: 'mouth',  text: '嘴巴' },
  { slug: 'nose',   text: '鼻子' },
  { slug: 'pink',   text: '粉色' },
  { slug: 'rabbit', text: '兔子' },
  { slug: 'red',    text: '红色' },
  { slug: 'rice',   text: '米饭' },
  { slug: 'yellow', text: '黄色' },
];

// ── Greeting audio ────────────────────────────────────────────────────────────
const GREETING_AUDIO = { slug: 'lets-learn', text: "Let's learn!" };

// ── Song audio (TTS spoken versions) ─────────────────────────────────────────
const SONG_FILES: Array<{ slug: string; text: string }> = [
  {
    slug: 'twinkle',
    text:
      'Twinkle, twinkle, little star. How I wonder what you are. ' +
      'Up above the world so high, like a diamond in the sky. ' +
      'Twinkle, twinkle, little star. How I wonder what you are.',
  },
  {
    slug: 'old-macdonald',
    text:
      'Old MacDonald had a farm, E-I-E-I-O. ' +
      'And on his farm he had a cow, E-I-E-I-O. ' +
      'With a moo moo here, and a moo moo there, here a moo, there a moo, everywhere a moo moo. ' +
      'Old MacDonald had a farm, E-I-E-I-O.',
  },
  {
    slug: 'head-shoulders',
    text:
      'Head, shoulders, knees and toes, knees and toes. ' +
      'Head, shoulders, knees and toes, knees and toes. ' +
      'Eyes and ears and mouth and nose. ' +
      'Head, shoulders, knees and toes, knees and toes.',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

function isStubFile(filePath: string): boolean {
  if (!fs.existsSync(filePath)) return true;
  const size = fs.statSync(filePath).size;
  // Stub files are exactly 443 bytes (OpenAI error JSON); real MP3s are ≥ 5 KB
  return size < 2000;
}

async function generateTts(
  client: OpenAI,
  text: string,
  outputPath: string,
  label: string
): Promise<boolean> {
  try {
    const response = await client.audio.speech.create({
      model: 'tts-1',
      voice: 'nova',
      input: text,
      speed: 0.85,
    });
    const buffer = Buffer.from(await response.arrayBuffer());
    fs.writeFileSync(outputPath, buffer);
    console.log(`  ✅ ${label} → ${path.relative(process.cwd(), outputPath)} (${buffer.length} bytes)`);
    return true;
  } catch (err) {
    console.error(`  ❌ ${label} FAILED:`, (err as Error).message);
    return false;
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY is not set.');
    process.exit(1);
  }

  const client = new OpenAI({ apiKey });

  fs.mkdirSync(ZH_DIR, { recursive: true });
  fs.mkdirSync(EN_DIR, { recursive: true });
  fs.mkdirSync(SONGS_DIR, { recursive: true });

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  // ── 1. Fix 20 corrupted Mandarin TTS files ──────────────────────────────
  console.log('\n🀄  Regenerating 20 corrupted Mandarin TTS files…');
  for (const { slug, text } of CORRUPTED_ZH_FILES) {
    const outputPath = path.join(ZH_DIR, `${slug}.mp3`);
    if (!isStubFile(outputPath)) {
      console.log(`  ⏭️  ${slug}.mp3 already valid — skipping`);
      skipped++;
      continue;
    }
    const ok = await generateTts(client, text, outputPath, `zh/${slug} ("${text}")`);
    if (ok) generated++; else failed++;
  }

  // ── 2. Generate greeting audio ──────────────────────────────────────────
  console.log('\n🔊 Generating greeting audio (lets-learn.mp3)…');
  const greetingPath = path.join(EN_DIR, `${GREETING_AUDIO.slug}.mp3`);
  if (fs.existsSync(greetingPath) && !isStubFile(greetingPath)) {
    console.log(`  ⏭️  ${GREETING_AUDIO.slug}.mp3 already exists — skipping`);
    skipped++;
  } else {
    const ok = await generateTts(client, GREETING_AUDIO.text, greetingPath, `en/${GREETING_AUDIO.slug}`);
    if (ok) generated++; else failed++;
  }

  // ── 3. Generate song audio files ────────────────────────────────────────
  console.log('\n🎵 Generating song audio files…');
  for (const { slug, text } of SONG_FILES) {
    const outputPath = path.join(SONGS_DIR, `${slug}.mp3`);
    if (fs.existsSync(outputPath) && !isStubFile(outputPath)) {
      console.log(`  ⏭️  songs/${slug}.mp3 already exists — skipping`);
      skipped++;
      continue;
    }
    const ok = await generateTts(client, text, outputPath, `songs/${slug}`);
    if (ok) generated++; else failed++;
  }

  // ── Summary ─────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log(`✅ Generated: ${generated}   ⏭️  Skipped: ${skipped}   ❌ Failed: ${failed}`);
  console.log('─'.repeat(60));

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
