import { existsSync } from 'fs';
import { join } from 'path';
import { VOCABULARY_SEED } from '../src/lib/vocabulary-seed';

const root = process.cwd();

let totalChecked = 0;
let missingImages = 0;
let missingAudioEn = 0;
let missingAudioZh = 0;

console.log(
  'Word'.padEnd(20),
  'Image'.padEnd(8),
  'Audio EN'.padEnd(12),
  'Audio ZH'.padEnd(12),
);
console.log('-'.repeat(54));

for (const word of VOCABULARY_SEED) {
  totalChecked++;

  const imagePath = join(root, 'public', word.imagePath);
  const audioEnPath = join(root, 'public', word.audioEnPath);
  const audioZhPath = join(root, 'public', word.audioZhPath);

  const imageOk = existsSync(imagePath);
  const audioEnOk = existsSync(audioEnPath);
  const audioZhOk = existsSync(audioZhPath);

  if (!imageOk) missingImages++;
  if (!audioEnOk) missingAudioEn++;
  if (!audioZhOk) missingAudioZh++;

  const imageStatus = imageOk ? 'PASS' : `FAIL (${word.imagePath})`;
  const audioEnStatus = audioEnOk ? 'PASS' : `FAIL (${word.audioEnPath})`;
  const audioZhStatus = audioZhOk ? 'PASS' : `FAIL (${word.audioZhPath})`;

  console.log(
    word.englishWord.padEnd(20),
    imageStatus.padEnd(8),
    audioEnStatus.padEnd(12),
    audioZhStatus.padEnd(12),
  );
}

console.log('-'.repeat(54));

const totalMissing = missingImages + missingAudioEn + missingAudioZh;

if (totalMissing > 0) {
  console.log(`\nERROR: ${totalMissing} asset(s) missing. Run npm run generate-assets to regenerate.`);
  if (missingImages > 0) console.log(`  - ${missingImages} missing image(s)`);
  if (missingAudioEn > 0) console.log(`  - ${missingAudioEn} missing English audio file(s)`);
  if (missingAudioZh > 0) console.log(`  - ${missingAudioZh} missing Mandarin audio file(s)`);
  process.exit(1);
} else {
  console.log(`\n✓ All ${totalChecked * 3} assets verified (${totalChecked} words × 3 files each).`);
  process.exit(0);
}
