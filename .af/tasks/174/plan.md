Build a bilingual English-learning app for Mandarin-speaking children ages 2 to 5.

## Target Users
- PRIMARY: A 2.5-year-old child who speaks/understands basic Mandarin, zero English exposure.
- SECONDARY: Mandarin-speaking parent who sets up the app and monitors progress.

## Core Learning Method
Mandarin-bridged English acquisition: every English word is paired with its Mandarin equivalent. At early stages, Mandarin scaffolding is heavy. At later stages, Mandarin fades and English becomes primary.

## Critical User Journeys (these MUST work end-to-end)

### Journey 1: First-time setup (parent)
Parent opens app -> enters child name -> selects age -> sets 4-digit PIN -> sees hand device to child screen -> done in under 2 minutes.

### Journey 2: Child plays a learning session
Child taps Start -> greeting with audio -> mood check (3 emoji choices) -> Let us learn transition with audio -> Explore Cards activity (tap each card to hear English + Mandarin with real DALL-E illustrations) -> celebration screen showing words learned -> back to home.

### Journey 3: Child plays freely from home screen
Child sees home screen with big activity buttons (Explore Cards, Listen and Find, Matching Pairs, Song Time) -> taps any activity -> plays with vocabulary words -> finishes -> returns to home screen. No rigid session flow required.

### Journey 4: Parent checks progress
Parent taps parent icon -> enters PIN -> sees dashboard with words learned, streak calendar, stage progress -> can adjust settings.

## Stage 1 Content (starting point, ~100 words)
Categories: Animals, Food, Colors, Body Parts, Family, Objects, Actions/Greetings.
Activities: Explore Cards (tap to hear), Listen and Find (hear word, tap correct picture), Matching Pairs (memory game), Song Time (nursery rhymes).

## Asset Requirements
- DALL-E 3 illustrations for EVERY vocabulary word (consistent kawaii art style, warm pastels, white background)
- OpenAI TTS audio for every word in English (nova voice, speed 0.85) AND Mandarin (nova voice, speed 0.85)
- Sound effects: correct tap, incorrect tap, celebration, transition whoosh
- App icon (panda mascot)
- Art style must be consistent across all illustrations -- define style prompt once, reuse everywhere

## Non-Negotiable Requirements
- Home screen with activity buttons -- child can freely explore, not locked into rigid session flow
- Every vocabulary card shows: real illustration (not emoji), English word, Mandarin word, audio play button
- Tapping a card plays English audio then Mandarin audio (using pre-generated OpenAI TTS files, NOT browser speechSynthesis)
- Portrait orientation for child screens, but must not break on desktop (no display:none on landscape)
- Data persists in IndexedDB -- vocabulary progress seeded on first setup
- No blank screens -- every route renders content
- All tap targets >= 88px for toddler fingers

## Tech Stack
Next.js 15, TypeScript, Tailwind CSS, Framer Motion for animations, IndexedDB (idb) for storage.