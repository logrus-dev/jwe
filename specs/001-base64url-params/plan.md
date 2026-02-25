# Implementation Plan: Base64URL-Encoded URL Parameters

**Branch**: `001-base64url-params` | **Date**: 2026-02-25 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-base64url-params/spec.md`

## Summary

The `?schema=` and `?key=` URL parameters currently accept raw (percent-decoded) JSON text. This feature changes the expected encoding to base64url (RFC 4648 §5), making the parameters safe to embed in URLs without percent-encoding JSON's special characters. The change is contained to one utility function added to `src/utils/urlParams.ts` and a small update to the URL-param loading logic in `src/App.tsx`. No new dependencies are required.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18.x, browser-native `atob()` + `TextDecoder` (no new packages)
**Storage**: N/A (client-side SPA, no persistence)
**Testing**: TypeScript strict-mode typecheck (`npm run typecheck`), ESLint (`npm run lint`), manual browser verification
**Target Platform**: Modern browsers (all support `atob` and `TextDecoder`)
**Project Type**: Client-side SPA
**Performance Goals**: N/A — decoding runs once on page load, negligible cost
**Constraints**: Must produce a purely static build (no server runtime); no new npm dependencies
**Scale/Scope**: 2 files modified, ~16 lines of new/changed code

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Client-Side Sovereignty | PASS | Decoding uses browser-native APIs (`atob`, `TextDecoder`). No network calls, no server involvement. |
| II. Static Deployment | PASS | No new runtime dependencies. Build output remains purely static. |
| III. Simplicity (YAGNI) | PASS | One new pure function (~10 lines). No new abstractions, no new files, no new dependencies. |
| Technology: Minimise dependencies | PASS | Uses only browser-native APIs; no new npm package. |
| Technology: Approved algorithms | N/A | Base64url is an encoding scheme, not a cryptographic algorithm. |

**Post-design re-check**: All principles still pass. The `decodeBase64UrlParam` function is a justified, minimal utility that directly serves FR-001 and FR-002 with no unnecessary complexity.

**Complexity Tracking**: No violations to justify.

## Project Structure

### Documentation (this feature)

```text
specs/001-base64url-params/
├── plan.md              # This file
├── research.md          # Phase 0 — decoding approach, dependency decisions
├── data-model.md        # Phase 1 — DecodeResult type, data flow diagram
├── quickstart.md        # Phase 1 — how to generate test URLs, verification checklist
├── checklists/
│   └── requirements.md  # Spec quality checklist (all pass)
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code

```text
src/
├── utils/
│   └── urlParams.ts     ← Add: decodeBase64UrlParam() pure function, DecodeResult type
└── App.tsx              ← Modify: useEffect decodes raw params before parsing/importing
```

**Structure Decision**: Single project (existing SPA). Only two files require changes; no new files in `src/`.

## Implementation Design

### `src/utils/urlParams.ts` — changes

**Add**: `DecodeResult` discriminated union type.

**Add**: `decodeBase64UrlParam(raw: string): DecodeResult` pure function.

```
Algorithm:
  1. Replace '-' with '+' and '_' with '/' (RFC 4648 §5 reversal)
  2. Append '=' padding so length is a multiple of 4
  3. Call atob() to get Latin1-encoded byte string
  4. Decode UTF-8 via TextDecoder from Uint8Array
  5. Return { value, error: null } on success
  6. Catch any exception → return { value: null, error: 'Invalid base64url encoding' }
```

`readUrlParams()` is **unchanged** — it continues to return raw URL param values for use by the step-hiding lazy initializers.

### `src/App.tsx` — changes

**Modify** the `useEffect` (lines 61–93): before passing `params.schema` and `params.key` to `parseSchema` / `validateAndImportKey`, run each through `decodeBase64UrlParam`.

```
Before (current):
  if (params.schema) {
    const result = parseSchema(params.schema);
    ...
  }

After:
  if (params.schema) {
    const decoded = decodeBase64UrlParam(params.schema);
    if (decoded.error) {
      errors.schema = decoded.error;
    } else {
      const result = parseSchema(decoded.value);
      ...
    }
  }
```

Same pattern for `params.key`.

The lazy initializers (`schemaFromUrl`, `keyFromUrl`) are **unchanged** — they still check raw param presence.

## Artifacts

- [research.md](research.md) — decoding mechanism, dependency and architecture decisions
- [data-model.md](data-model.md) — `DecodeResult` type, function spec, data flow
- [quickstart.md](quickstart.md) — test URL generation, verification checklist, migration note
