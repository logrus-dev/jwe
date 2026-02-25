# Data Model: Base64URL-Encoded URL Parameters

## Existing Types (unchanged)

### `UrlParams` (src/utils/urlParams.ts)

```
UrlParams {
  schema: string | null   // raw URL param value (?schema=), or null if absent
  key:    string | null   // raw URL param value (?key=),    or null if absent
}
```

No change. `readUrlParams()` continues to return raw (percent-decoded but NOT base64url-decoded) values.

---

## New Type

### `DecodeResult` (src/utils/urlParams.ts)

A discriminated union representing the outcome of decoding a single base64url URL parameter value.

```
DecodeResult =
  | { value: string; error: null   }   // success: decoded UTF-8 string
  | { value: null;   error: string }   // failure: human-readable error message
```

**Fields**:

| Field | Type | Description |
|-------|------|-------------|
| `value` | `string \| null` | The decoded UTF-8 string on success; `null` on failure |
| `error` | `string \| null` | Human-readable decode error on failure; `null` on success |

**Invariants**:
- `value` and `error` are mutually exclusive: exactly one is non-null.
- A successful result always carries a non-empty string value.
- An error result always carries a non-empty error message.

---

## New Pure Function

### `decodeBase64UrlParam(raw: string): DecodeResult`

| Input | Output | Notes |
|-------|--------|-------|
| Valid base64url string | `{ value: "<decoded JSON>", error: null }` | RFC 4648 §5 decoded, UTF-8 |
| Non-base64url characters | `{ value: null, error: "Invalid base64url encoding" }` | `atob()` throws |
| Valid base64url but non-UTF-8 | `{ value: null, error: "Invalid base64url encoding" }` | `TextDecoder` throws |

**Algorithm**:
1. Replace `-` with `+` and `_` with `/` (URL-safe → standard base64 alphabet)
2. Append `=` padding: `'='.repeat((4 - raw.length % 4) % 4)`
3. `atob(padded)` → Latin1 string of raw bytes
4. `new TextDecoder().decode(Uint8Array.from(latin1, c => c.charCodeAt(0)))` → UTF-8 string
5. Return `{ value, error: null }` on success; catch any exception and return `{ value: null, error: "Invalid base64url encoding" }`

---

## Data Flow

```
URL: ?schema=<base64url>&key=<base64url>
        |
        v
readUrlParams()          → UrlParams { schema: "<base64url>", key: "<base64url>" }
        |
        | (lazy init, synchronous — for step-hiding only)
        v
schemaFromUrl = schema !== null && schema !== ''   (raw param presence)
keyFromUrl    = key    !== null && key    !== ''   (raw param presence)
        |
        | (useEffect, on mount)
        v
decodeBase64UrlParam(schema)  → DecodeResult
decodeBase64UrlParam(key)     → DecodeResult
        |
        ├── on success → pass decoded string to existing parseSchema() / validateAndImportKey()
        └── on failure → set urlErrors.schema / urlErrors.key
```
