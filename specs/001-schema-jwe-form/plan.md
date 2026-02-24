# Implementation Plan: Schema-Driven JWE Form Encryptor

**Branch**: `001-schema-jwe-form` | **Date**: 2026-02-23 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-schema-jwe-form/spec.md`

## Summary

Build a static, client-only web application that renders a data entry form from a
user-provided JSON Schema, masks fields marked `x-sensitive: true`, and encrypts the
collected JSON payload into a JWE compact serialization using the recipient's RSA public
key (JWK format). The encrypted payload is displayed for copy. Schema and key can be
pre-loaded via URL query parameters.

**Technical approach**: React 18 + Vite (static build). RJSF (`@rjsf/core` + `@rjsf/mantine`)
for schema-driven form rendering. `jose` library for browser-native JWE encryption.
Mantine v7 for polished UI components including a built-in CopyButton.

## Technical Context

**Language/Version**: TypeScript 5.x / React 18.x
**Primary Dependencies**: `@rjsf/core` v5, `@rjsf/mantine`, `jose` v6, `@mantine/core` v7,
`@mantine/notifications`, `@mantine/code-highlight`
**Storage**: N/A (no persistence; all state is session-transient)
**Testing**: Vitest (unit) — optional per constitution; quickstart.md for manual validation
**Target Platform**: Modern browsers (Chrome 90+, Firefox 90+, Safari 15+) via static HTML
**Project Type**: Static client-side web application
**Performance Goals**: Page load < 3s on standard broadband; encryption completes < 1s
for typical key sizes (2048-bit RSA)
**Constraints**: Zero server-side runtime; all crypto via browser Web Crypto API (via jose);
no external network calls during encryption workflow
**Scale/Scope**: Single-page application; single concurrent user per browser tab

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### I. Client-Side Sovereignty ✅ PASS
All encryption via `jose` (which wraps Web Crypto API — browser-native). JWK key import,
plaintext composition, and JWE encryption all happen in the browser JS runtime. No user
data, key material, or schema is sent to any server. Vite static build guarantees no
server-side code exists in the deployed application.

### II. Static Deployment ✅ PASS
`npm run build` produces `dist/` containing only `index.html` + hashed JS/CSS assets.
Deployable to any CDN, GitHub Pages, Netlify, S3 static hosting, or `file://` URL.
No Node.js, no server process required at runtime.

### III. Simplicity (YAGNI) ✅ PASS
Using established, purpose-built libraries (RJSF, jose, Mantine) rather than custom
implementations. Each library is chosen because it directly solves a specific need:
- RJSF: JSON Schema → form, so we don't build a form renderer
- jose: JWE serialization, so we don't implement RFC 7516 manually
- Mantine: polished UI + CopyButton, so we don't write custom CSS

No plugin architecture, no feature flags, no speculative abstractions. The `schemaUtils.ts`
utility is the only project-specific transformation layer (schema → uiSchema for x-sensitive).

*Post-Phase-1 re-check*: Architecture remains minimal. No additional complexity violations
identified. Component structure is flat: 4 UI components + 3 utility modules.

## Project Structure

### Documentation (this feature)

```text
specs/001-schema-jwe-form/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/
│   └── ui-contract.md   # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks command)
```

### Source Code (repository root)

```text
index.html                    # Vite entry point
vite.config.ts                # Vite configuration (@vitejs/plugin-react)
tsconfig.json
package.json

src/
├── main.tsx                  # React root, MantineProvider, router/theme setup
├── App.tsx                   # Top-level layout: header + step cards
│
├── components/
│   ├── SchemaInput.tsx       # Step 1: JSON Schema textarea + parse button + error alert
│   ├── DynamicForm.tsx       # Step 2: RJSF Form with @rjsf/mantine theme
│   ├── PublicKeyInput.tsx    # Step 3: JWK key textarea + validation badge
│   └── EncryptedOutput.tsx   # Step 4: Encrypt button + JWE code display + CopyButton
│
└── utils/
    ├── schemaUtils.ts        # Schema validation + x-sensitive → uiSchema derivation
    ├── encrypt.ts            # jose CompactEncrypt wrapper (importJWK + encrypt)
    └── urlParams.ts          # URL query param parsing (?schema=, ?key=)

dist/                         # Vite build output (gitignored)
```

**Structure Decision**: Single project (Option 1), client-side only. No `backend/`,
no `api/` directory. The `src/` layout uses feature-adjacent organization: 4 UI
components matching the 4-step user workflow, and 3 utility modules matching the 3
computational concerns (schema processing, encryption, URL parsing).

## Complexity Tracking

> No violations — no entries required.

All dependencies are directly justified by concrete, current needs:
- `@rjsf/core`: JSON Schema form rendering (not buildable simply from scratch)
- `@rjsf/mantine`: Mantine widget bridge (saves custom theme authoring)
- `jose`: JWE compact serialization (not trivially implementable without it)
- `@mantine/core`: polished UI components including CopyButton
- `@mantine/notifications`: toast error system
- `@mantine/code-highlight`: scrollable, readable JWE output area
