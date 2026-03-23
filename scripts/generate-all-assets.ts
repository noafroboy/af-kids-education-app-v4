import { generateImages } from './generate-images';
import { generateAudioEn } from './generate-audio-en';
import { generateAudioZh } from './generate-audio-zh';

interface CliOptions {
  imagesOnly: boolean;
  audioOnly: boolean;
  wordSlug?: string;
  force: boolean;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const opts: CliOptions = {
    imagesOnly: args.includes('--images-only'),
    audioOnly: args.includes('--audio-only'),
    force: args.includes('--force'),
  };
  const wordIdx = args.indexOf('--word');
  if (wordIdx !== -1) {
    opts.wordSlug = args[wordIdx + 1];
    if (!opts.wordSlug) {
      console.error('❌ --word requires a slug argument (e.g. --word cat)');
      process.exit(1);
    }
  }
  if (opts.imagesOnly && opts.audioOnly) {
    console.error('❌ --images-only and --audio-only cannot be used together');
    process.exit(1);
  }
  return opts;
}

async function main(): Promise<void> {
  const opts = parseArgs();

  console.log('🚀 LittleBridge asset generation starting…\n');
  if (opts.force) console.log('⚠️  --force mode: existing files will be overwritten\n');

  const summary = {
    images: { generated: 0, skipped: 0, failed: 0 },
    audioEn: { generated: 0, skipped: 0, failed: 0 },
    audioZh: { generated: 0, skipped: 0, failed: 0 },
  };

  try {
    if (!opts.audioOnly) {
      console.log('📸 Generating vocabulary images (DALL-E 3)…');
      summary.images = await generateImages({ force: opts.force, wordSlug: opts.wordSlug });
    }

    if (!opts.imagesOnly) {
      console.log('\n🔊 Generating English TTS audio…');
      summary.audioEn = await generateAudioEn({ force: opts.force, wordSlug: opts.wordSlug });

      console.log('\n🀄  Generating Mandarin TTS audio (Google Cloud)…');
      summary.audioZh = await generateAudioZh({ force: opts.force, wordSlug: opts.wordSlug });
    }
  } catch (err) {
    console.error('\n💥 Unexpected error:', err);
    process.exit(1);
  }

  const totalGenerated =
    summary.images.generated + summary.audioEn.generated + summary.audioZh.generated;
  const totalSkipped =
    summary.images.skipped + summary.audioEn.skipped + summary.audioZh.skipped;
  const totalFailed =
    summary.images.failed + summary.audioEn.failed + summary.audioZh.failed;

  console.log('\n' + '─'.repeat(60));
  console.log(
    `✅ Generated: ${totalGenerated} images (${summary.images.generated}), ` +
      `EN audio (${summary.audioEn.generated}), ZH audio (${summary.audioZh.generated})`
  );
  console.log(`⏭️  Skipped:   ${totalSkipped}`);
  console.log(`❌ Failed:    ${totalFailed}`);
  console.log('─'.repeat(60));

  if (totalFailed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
