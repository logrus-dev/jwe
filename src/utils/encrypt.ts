import { CompactEncrypt, importJWK } from 'jose';
import type { JWK } from 'jose';

export interface KeyImportResult {
  cryptoKey: CryptoKey;
  jwk: JWK;
}

export async function validateAndImportKey(raw: string): Promise<KeyImportResult> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('Invalid JSON — paste a valid JWK object');
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new Error('Key must be a JSON object');
  }

  const jwk = parsed as JWK;

  if (!jwk.kty) {
    throw new Error('Missing "kty" field — not a valid JWK');
  }

  const cryptoKey = await importJWK(jwk, 'RSA-OAEP-256') as CryptoKey;
  return { cryptoKey, jwk };
}

export async function encryptPayload(
  data: object,
  cryptoKey: CryptoKey,
): Promise<string> {
  const plaintext = new TextEncoder().encode(JSON.stringify(data));
  return new CompactEncrypt(plaintext)
    .setProtectedHeader({ alg: 'RSA-OAEP-256', enc: 'A256GCM' })
    .encrypt(cryptoKey);
}
