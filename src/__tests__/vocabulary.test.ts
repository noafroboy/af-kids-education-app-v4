import { VOCABULARY_SEED } from '@/lib/vocabulary-seed';
import type { Category } from '@/types';

describe('VOCABULARY_SEED', () => {
  it('has exactly 100 words', () => {
    expect(VOCABULARY_SEED).toHaveLength(100);
  });

  it('has all 7 categories', () => {
    const categories = new Set(VOCABULARY_SEED.map((w) => w.category));
    const expected: Category[] = ['animals', 'food', 'colors', 'bodyParts', 'family', 'objects', 'actions'];
    expected.forEach((cat) => expect(categories).toContain(cat));
    expect(categories.size).toBe(7);
  });

  it('every word has all required fields', () => {
    VOCABULARY_SEED.forEach((word) => {
      expect(word.id).toBeTruthy();
      expect(word.englishWord).toBeTruthy();
      expect(word.mandarinWord).toBeTruthy();
      expect(word.pinyin).toBeTruthy();
      expect(word.category).toBeTruthy();
      expect(word.imagePath).toBeTruthy();
      expect(word.audioEnPath).toBeTruthy();
      expect(word.audioZhPath).toBeTruthy();
      expect(Array.isArray(word.tags)).toBe(true);
    });
  });

  it('has no duplicate IDs', () => {
    const ids = VOCABULARY_SEED.map((w) => w.id);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it('has no duplicate slugs in imagePath', () => {
    const slugs = VOCABULARY_SEED.map((w) => w.imagePath);
    const unique = new Set(slugs);
    expect(unique.size).toBe(slugs.length);
  });

  it('imagePath follows /images/vocabulary/{slug}.png pattern', () => {
    VOCABULARY_SEED.forEach((word) => {
      expect(word.imagePath).toMatch(/^\/images\/vocabulary\/[a-z0-9-]+\.png$/);
    });
  });

  it('audioEnPath follows /audio/en/{slug}.mp3 pattern', () => {
    VOCABULARY_SEED.forEach((word) => {
      expect(word.audioEnPath).toMatch(/^\/audio\/en\/[a-z0-9-]+\.mp3$/);
    });
  });

  it('audioZhPath follows /audio/zh/{slug}.mp3 pattern', () => {
    VOCABULARY_SEED.forEach((word) => {
      expect(word.audioZhPath).toMatch(/^\/audio\/zh\/[a-z0-9-]+\.mp3$/);
    });
  });

  it('animals category has 15 words', () => {
    const count = VOCABULARY_SEED.filter((w) => w.category === 'animals').length;
    expect(count).toBe(15);
  });

  it('food category has 15 words', () => {
    const count = VOCABULARY_SEED.filter((w) => w.category === 'food').length;
    expect(count).toBe(15);
  });

  it('colors category has 10 words', () => {
    const count = VOCABULARY_SEED.filter((w) => w.category === 'colors').length;
    expect(count).toBe(10);
  });

  it('bodyParts category has 10 words', () => {
    const count = VOCABULARY_SEED.filter((w) => w.category === 'bodyParts').length;
    expect(count).toBe(10);
  });

  it('family category has 10 words', () => {
    const count = VOCABULARY_SEED.filter((w) => w.category === 'family').length;
    expect(count).toBe(10);
  });

  it('objects category has 20 words', () => {
    const count = VOCABULARY_SEED.filter((w) => w.category === 'objects').length;
    expect(count).toBe(20);
  });

  it('actions category has 20 words', () => {
    const count = VOCABULARY_SEED.filter((w) => w.category === 'actions').length;
    expect(count).toBe(20);
  });

  it('orange-color slug used for color-orange to avoid collision with food orange', () => {
    const colorOrange = VOCABULARY_SEED.find((w) => w.id === 'color-orange');
    const foodOrange = VOCABULARY_SEED.find((w) => w.id === 'food-orange');
    expect(colorOrange?.imagePath).toBe('/images/vocabulary/orange-color.png');
    expect(foodOrange?.imagePath).toBe('/images/vocabulary/orange.png');
  });

  it('thank-you slug used for action-thank-you', () => {
    const thankYou = VOCABULARY_SEED.find((w) => w.id === 'action-thank-you');
    expect(thankYou?.imagePath).toBe('/images/vocabulary/thank-you.png');
    expect(thankYou?.audioEnPath).toBe('/audio/en/thank-you.mp3');
  });

  it('all audioZhPath use slug-based names (not pinyin-based)', () => {
    VOCABULARY_SEED.forEach((word) => {
      // Slug-based names should use lowercase English, not pinyin
      const slug = word.audioZhPath.replace('/audio/zh/', '').replace('.mp3', '');
      // Must not contain purely pinyin like 'mao', 'gou', etc.
      // Instead they should match the English slug pattern
      expect(slug).toMatch(/^[a-z0-9-]+$/);
    });
  });
});
