/**
 * Polyfill minimal de WebCrypto pour Hermes (natif), à importer avant supabase-js.
 *
 * Hermes n'expose pas `crypto` : supabase-js retombe alors sur un code_verifier PKCE
 * tiré de Math.random() et une méthode `plain` (warning « WebCrypto API is not
 * supported »). On fournit les deux seules API qu'il utilise — `getRandomValues` et
 * `subtle.digest` — adossées à expo-crypto (compatible Expo Go). Sur web, le
 * navigateur fournit déjà WebCrypto : rien n'est installé.
 */

import { CryptoDigestAlgorithm, digest, getRandomValues } from 'expo-crypto';

const DIGEST_ALGORITHMS: Record<string, CryptoDigestAlgorithm> = {
  'SHA-1': CryptoDigestAlgorithm.SHA1,
  'SHA-256': CryptoDigestAlgorithm.SHA256,
  'SHA-384': CryptoDigestAlgorithm.SHA384,
  'SHA-512': CryptoDigestAlgorithm.SHA512,
};

function subtleDigest(
  algorithm: AlgorithmIdentifier,
  data: BufferSource,
): Promise<ArrayBuffer> {
  const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
  const expoAlgorithm = DIGEST_ALGORITHMS[name.toUpperCase()];
  if (!expoAlgorithm) {
    return Promise.reject(new Error(`[crypto-polyfill] Algorithme non supporté : ${name}`));
  }
  return digest(expoAlgorithm, data);
}

if (typeof globalThis.crypto === 'undefined') {
  Object.defineProperty(globalThis, 'crypto', {
    value: { getRandomValues, subtle: { digest: subtleDigest } },
    configurable: true,
  });
} else if (typeof globalThis.crypto.subtle === 'undefined') {
  Object.defineProperty(globalThis.crypto, 'subtle', {
    value: { digest: subtleDigest },
    configurable: true,
  });
}
