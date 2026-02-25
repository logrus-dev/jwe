export interface UrlParams {
  schema: string | null;
  key: string | null;
}

// RFC 4648 §5 base64url decode result — exactly one of value/error is non-null
export type DecodeResult =
  | { value: string; error: null }
  | { value: null; error: string };

// Decode a base64url-encoded string (RFC 4648 §5) to UTF-8 text.
export function decodeBase64UrlParam(raw: string): DecodeResult {
  try {
    const b64 = raw.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - raw.length % 4) % 4);
    const latin1 = atob(b64);
    const value = new TextDecoder().decode(Uint8Array.from(latin1, c => c.charCodeAt(0)));
    return { value, error: null };
  } catch {
    return { value: null, error: 'Invalid base64url encoding' };
  }
}

export function readUrlParams(): UrlParams {
  const params = new URLSearchParams(window.location.search);
  return {
    schema: params.get('schema'),
    key: params.get('key'),
  };
}
