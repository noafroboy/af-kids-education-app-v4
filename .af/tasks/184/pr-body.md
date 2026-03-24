## Summary
- Regenerates 13 broken Mandarin TTS audio files that previously contained JSON error responses instead of valid MP3 data, restoring correct pronunciation for all target vocabulary words
- Generates 3 song audio files for the Song Time activity (twinkle, old-macdonald, head-shoulders) that were entirely missing
- Resizes all vocabulary images from 1024×1024 → 512×512 for faster mobile loading, and removes 7 stale pinyin-named orphaned audio files

## Changes

### Deleted
- `public/audio/zh/bizi.mp3`, `fense.mp3`, `gou.mp3`, `hongse.mp3`, `huangse.mp3`, `jiao.mp3`, `xiangjiao.mp3` — stale artifacts from renamed vocabulary schema (canonical files are English-named)

### New Scripts
- `scripts/generate-audio-zh-fix.ts` — force-regenerates 13 Mandarin TTS files (apple, cat, dog, rabbit, fish, bird, milk, rice, egg, banana, lion, bear, grape) using OpenAI tts-1-hd/nova at 0.85 speed; concurrency limit of 3; validates MP3 magic bytes (ID3 or 0xFF sync); reads API key from env or `.env.local`; includes inline fallback Mandarin text for words not in FULL_VOCABULARY (lion/bear/grape)
- `scripts/generate-audio-songs.ts` — generates 3 Song Time MP3s using tts-1-hd/nova at 0.9 speed; skips files that already exist and pass MP3 validation; same API key loading and validation logic

### Modified
- `scripts/generate-audio-zh-openai-fallback.ts` — upgraded model from `tts-1` → `tts-1-hd`, added MP3 magic byte validation after each write, added comment directing targeted regeneration to the new fix script

### Generated Assets
- `public/audio/zh/` — 13 Mandarin MP3s regenerated (all pass ID3 header validation)
- `public/audio/songs/` — 3 song MP3s created (all pass ID3 header validation)
- `public/images/vocabulary/*.png` — all 20 vocabulary images resized from 1024px → 512px (~1MB → ~250KB each)

## Testing
- TypeScript type-check (`npx tsc --noEmit`) passes with zero errors
- All 179 existing Jest tests pass (`npm test`)
- Generated Mandarin audio files verified: all 13 start with valid ID3 headers (confirmed by script output)
- Generated song files verified: all 3 start with valid ID3 headers
- Vocabulary image dimensions verified: `sips -g pixelHeight` confirms 512px for apple, dog, cat
- Orphaned files confirmed absent: `ls public/audio/zh/ | grep bizi` returns nothing
