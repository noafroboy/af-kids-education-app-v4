import { cn, shuffleArray, formatDate, slugify } from '@/lib/utils';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4');
  });

  it('handles conditional classes', () => {
    expect(cn('base', false && 'skip', 'end')).toBe('base end');
  });
});

describe('shuffleArray', () => {
  it('returns same elements in possibly different order', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffleArray(arr);
    expect(result).toHaveLength(arr.length);
    expect(result.sort()).toEqual([...arr].sort());
  });

  it('does not mutate original array', () => {
    const arr = [1, 2, 3];
    const copy = [...arr];
    shuffleArray(arr);
    expect(arr).toEqual(copy);
  });
});

describe('formatDate', () => {
  it('formats a date as YYYY-MM-DD', () => {
    const d = new Date(2026, 2, 23); // March 23 2026
    expect(formatDate(d)).toBe('2026-03-23');
  });

  it('pads month and day with zeros', () => {
    const d = new Date(2026, 0, 5); // Jan 5
    expect(formatDate(d)).toBe('2026-01-05');
  });
});

describe('slugify', () => {
  it('converts to lowercase with hyphens', () => {
    expect(slugify('Hello World')).toBe('hello-world');
  });

  it('removes special characters', () => {
    expect(slugify('Cat & Dog!')).toBe('cat-dog');
  });

  it('collapses multiple hyphens', () => {
    expect(slugify('a--b')).toBe('a-b');
  });
});
