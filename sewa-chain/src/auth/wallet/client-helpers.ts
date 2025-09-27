/**
 * Generates a simple hash of the provided nonce (browser-compatible).
 * @param {Object} params - The parameters object.
 * @param {string} params.nonce - The nonce to be hashed.
 * @returns {string} The resulting hash in hexadecimal format.
 */
export const hashNonce = ({ nonce }: { nonce: string }) => {
  // Simple hash function for browser compatibility
  let hash = 0;
  for (let i = 0; i < nonce.length; i++) {
    const char = nonce.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(16).padStart(16, "0");
};
