/**
 * Generates a random number between 0 and 1 using a cryptographically strong random number generator.
 * This is used to satisfy security linters (like SonarQube) that flag Math.random() as unsafe.
 */
export function secureRandom(): number {
  if (typeof globalThis.window !== 'undefined' && globalThis.crypto) {
    const array = new Uint32Array(1);
    globalThis.crypto.getRandomValues(array);
    return array[0] / 4294967296; // 2^32
  }
  
  // Node.js fallback
  try {
    const crypto = require('node:crypto');
    return crypto.randomBytes(4).readUInt32BE() / 4294967296;
  } catch (e) {
    console.error('Secure random generation failed:', e);
    return 0.5;
  }
}
