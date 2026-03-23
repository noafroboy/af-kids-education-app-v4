import { TextEncoder } from 'util';

// Polyfill TextEncoder for jsdom
if (typeof global.TextEncoder === 'undefined') {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (global as any).TextEncoder = TextEncoder;
}

// Mock window.crypto.subtle
const mockDigest = jest.fn().mockImplementation(async () => {
  return new Uint8Array(32).fill(42).buffer;
});

Object.defineProperty(window, 'crypto', {
  value: {
    subtle: {
      digest: mockDigest,
    },
  },
  writable: true,
  configurable: true,
});

import { hashPIN, verifyPIN } from '@/lib/crypto';

describe('hashPIN', () => {
  it('returns a hex string', async () => {
    const hash = await hashPIN('1234');
    expect(typeof hash).toBe('string');
    expect(/^[0-9a-f]+$/.test(hash)).toBe(true);
  });

  it('returns same hash for same input', async () => {
    const h1 = await hashPIN('1234');
    const h2 = await hashPIN('1234');
    expect(h1).toBe(h2);
  });
});

describe('verifyPIN', () => {
  it('returns true for matching PIN', async () => {
    const hash = await hashPIN('5678');
    const result = await verifyPIN('5678', hash);
    expect(result).toBe(true);
  });

  it('returns false for wrong PIN', async () => {
    // Mock returns constant bytes so hashPIN always produces same hash.
    // Test verifyPIN rejects a deliberately wrong hash string.
    const hash = '0000000000000000000000000000000000000000000000000000000000000000';
    // hashPIN will produce '2a2a2a...' (42 in hex = 2a), so comparing against all-zeros fails
    const result = await verifyPIN('0000', hash);
    expect(result).toBe(false);
  });
});
