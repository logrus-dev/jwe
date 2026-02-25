# Research: Base64URL-Encoded URL Parameters

## Decisions

### 1. Decoding mechanism

**Decision**: Use the browser-native `atob()` + `TextDecoder` APIs. No third-party library.

**Rationale**: The conversion from base64url to standard base64 is trivial (replace `-`→`+`, `_`→`/`, add `=` padding). `atob()` is universally available in all browsers and handles the standard base64 decode. `TextDecoder` converts the raw bytes to a proper UTF-8 string, correctly handling any non-ASCII characters in the JSON content.

**Alternatives considered**:
- `jose`'s internal base64url utilities: available in the existing `jose` dependency, but these are not part of its public API and would be relying on undocumented internals.
- A separate npm package (e.g., `base64url`): unnecessary dependency for a 5-line pure function. Violates Constitution Principle III (YAGNI) and Principle II (dependency minimization).

---

### 2. Where to add decoding

**Decision**: Add a new pure function `decodeBase64UrlParam(raw: string)` in `src/utils/urlParams.ts`. Call it from the existing `useEffect` in `App.tsx`.

**Rationale**: `urlParams.ts` already owns URL parameter concerns. Adding the decode function there keeps the logic cohesive. `readUrlParams()` continues to return raw string values (unchanged), so the lazy initializers in `App.tsx` that control step-hiding remain untouched.

**Alternatives considered**:
- Change `readUrlParams()` to return decoded values: would require `readUrlParams()` to return errors too, complicating its signature. The step-hiding lazy initializers need raw param presence (not decoded value) — so this would require either a second raw-values function or a mixed return type.
- Decode inline in `App.tsx` without a utility function: scatters the decoding logic inside component code; harder to test and understand.

---

### 3. Step-hiding behavior when decoding fails

**Decision**: Step-hiding (`schemaFromUrl`, `keyFromUrl` in `App.tsx`) continues to be based on raw URL param presence (non-null, non-empty), independent of decoding outcome.

**Rationale**: The lazy initializers run synchronously on first render (before the `useEffect` fires), so they can only use synchronous data. Using raw param presence avoids a flash of the step appearing then disappearing. If decoding fails, an error alert is shown and the step remains hidden — consistent with current behavior when the decoded value is invalid JSON.

---

### 4. Base64url padding

**Decision**: Add `=` padding before calling `atob()` using `'='.repeat((4 - raw.length % 4) % 4)`.

**Rationale**: RFC 4648 §5 defines base64url as base64 with URL-safe characters and omitted padding. `atob()` requires properly-padded standard base64. The padding calculation `(4 - n % 4) % 4` gives 0 padding for multiples of 4, 1 `=` for remainder 3, and 2 `=` for remainder 2. Remainder 1 is invalid by the RFC and will fail in `atob()`, which is correct behavior — we want to surface that as a decode error.

---

### 5. New dependencies

**Decision**: None.

**Rationale**: The entire implementation uses browser-native APIs (`atob`, `TextDecoder`) and TypeScript's standard `try/catch`. Constitution Principle III and Principle II both require minimising dependencies.

---

## Summary

The implementation is entirely contained in two files:

| File | Change |
|------|--------|
| `src/utils/urlParams.ts` | Add `decodeBase64UrlParam()` pure function (~10 lines) |
| `src/App.tsx` | `useEffect`: decode raw params before use (~6 lines changed) |

No new files, no new dependencies, no new abstractions.
