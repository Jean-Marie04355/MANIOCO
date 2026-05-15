/**
 * Generates a random number between 0 and 1 using a cryptographically strong random number generator.
 * This is used to satisfy security linters (like SonarQube) that flag Math.random() as unsafe.
 */
export function secureRandom(): number {
  const crypto = globalThis.crypto || (globalThis as any).msCrypto;
  
  if (crypto && crypto.getRandomValues) {
    const array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / 4294967296; // 2^32
  }
  
  // Fallback to Math.random if no crypto API is available (should not happen in modern environments)
  return Math.random();
}
