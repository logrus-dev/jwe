# Research: Schema-Driven JWE Form Encryptor

**Feature**: 001-schema-jwe-form
**Date**: 2026-02-23
**Status**: Complete — all NEEDS CLARIFICATION resolved

---

## Decision 1: Form Generation Library

**Decision**: `@rjsf/core` v5 + `@rjsf/mantine` (official Mantine theme)

**Rationale**:
- RJSF is the most widely adopted JSON Schema → HTML form library in the React ecosystem
  (~13k GitHub stars, actively maintained by rjsf-team)
- Supports JSON Schema draft-07, the format specified in the Assumptions section
- `@rjsf/mantine` is an official RJSF theme package that wires Mantine UI components
  into RJSF widgets — all inputs, labels, error states, and validation use Mantine
  styling automatically
- `@rjsf/mantine` ships a built-in `PasswordWidget` that activates for fields with
  `"format": "password"` — we map `x-sensitive: true` → `"ui:widget": "password"`
  in a pre-processing step (`schemaUtils.ts`)
- Custom widgets are straightforward to register via `widgets` prop on the Form component
- `uiSchema` allows overriding widget, ordering, help text per-field without modifying
  the source schema

**Alternatives considered**:
- **json-forms** (EclipseSource): More powerful renderer pipeline but significantly more
  complex setup; better suited for enterprise multi-schema workflows; overkill here
- **uniforms**: Good support but smaller community; less active maintenance; Mantine
  integration would require custom work
- **formik + yup**: Not schema-driven in the JSON Schema sense; would require manual
  field-by-field rendering logic — contradicts Simplicity principle

---

## Decision 2: JWE Encryption Library

**Decision**: `jose` v6.x (panva/jose)

**Rationale**:
- Explicitly supports browser (ESM), Node.js, Deno, Bun, Cloudflare Workers — universal
- Ships as pure ESM, no Node.js polyfills required in Vite browser builds
- `CompactEncrypt` API produces JWE compact serialization directly (the output format
  required by the spec)
- `importJWK()` accepts a plain JSON object (JWK) and returns a browser `CryptoKey` —
  maps directly to "user pastes JWK text → JSON.parse → importJWK" flow
- Supports RSA-OAEP-256 (key encryption) + A256GCM (content encryption) — current
  NIST/IETF approved algorithms, compliant with constitution Principle I and II
- 3,262+ reverse dependencies on npm; actively maintained (v6.1.3 as of early 2026)
- TypeScript types included; tiny bundle impact (tree-shakeable)

**Default algorithm choice**:
- Key encryption: `RSA-OAEP-256` (RSA-OAEP with SHA-256 — stronger than RSA-OAEP/SHA-1)
- Content encryption: `A256GCM` (AES-256-GCM — authenticated encryption)
- These are standard defaults in most JWE implementations and require no configuration

**Alternatives considered**:
- **node-jose** (Cisco): Node.js-first; requires polyfills in browser; larger bundle;
  less actively maintained in 2025
- **Raw Web Crypto API (SubtleCrypto)**: Possible but requires manually implementing
  JWE compact serialization format (header encoding, CEK generation, IV, auth tag,
  concatenation) — significant boilerplate that violates Simplicity principle; jose
  is effectively a thin, well-tested wrapper over SubtleCrypto
- **@panva/jose (JSR)**: Same library, different registry — npm package `jose` is
  preferred for Vite/npm ecosystem

**Key import caveat**: `importJWK()` requires the key `"use"` parameter to be present
or the algorithm to be specified explicitly. We will always pass `{ alg: "RSA-OAEP-256" }`
as the second argument to `importJWK()` so user-pasted keys without `"alg"` still work.

---

## Decision 3: UI / CSS Framework

**Decision**: Mantine v7 (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`,
`@mantine/code-highlight`)

**Rationale**:
- Mantine has an official Vite integration guide and works as a pure SPA with no
  Next.js dependency
- Default theme is polished and modern out of the box — no custom CSS required for
  a professional appearance
- Native dark mode via `ColorSchemeScript` + `MantineProvider`
- Key components available for this feature:
  - `Textarea` — schema input (auto-resize, monospace)
  - `TextInput`, `PasswordInput` — form field widgets (used by `@rjsf/mantine`)
  - `CopyButton` — built-in clipboard copy with visual feedback ("Copied!")
  - `Notification` / `@mantine/notifications` — toast alerts for errors
  - `@mantine/code-highlight` — syntax-highlighted, scrollable display for the
    JWE output (long base64url string)
  - `Alert`, `Card`, `Stack`, `Group`, `Badge` — layout and status components
- `@rjsf/mantine` is the official bridge between RJSF and Mantine — all form fields
  rendered by RJSF will automatically use Mantine component styles
- Well-documented; large community; MIT licensed

**Alternatives considered**:
- **shadcn/ui**: Excellent quality but requires Tailwind CSS setup and component
  copy-paste — more initial overhead; no built-in CopyButton; less suited to
  RJSF integration without a custom theme
- **Chakra UI v3**: Good but no official RJSF theme; Mantine has one
- **Ant Design**: Enterprise look; heavier bundle; `@rjsf/antd` exists but the
  visual aesthetic is less "fancy modern"
- **HeroUI (NextUI v2)**: Beautiful design system but Next.js-optimized; Vite
  setup more involved; no RJSF theme

---

## Decision 4: Build Tool

**Decision**: Vite 6.x

**Rationale**:
- Fastest dev server startup and HMR for React/TypeScript SPAs
- Static production build (`vite build`) outputs `dist/` — pure HTML + JS + CSS,
  no server runtime
- First-class React + TypeScript support via `@vitejs/plugin-react`
- Tree-shaking eliminates unused Mantine/RJSF code from bundle
- `vite preview` allows local static-serve testing of the built output

**Alternatives considered**:
- **Create React App**: Deprecated / unmaintained
- **Parcel**: Zero-config but fewer ecosystem integrations; slower in some benchmarks
- **webpack**: More configuration required; slower dev experience

---

## Decision 5: x-sensitive Field Handling

**Decision**: Pre-process schema before passing to RJSF — generate a derived `uiSchema`
that maps fields with `x-sensitive: true` to `"ui:widget": "password"`.

**Rationale**: RJSF does not natively recognize `x-sensitive`; it does natively support
the `uiSchema` mechanism for specifying per-field widget overrides. A small utility
function in `schemaUtils.ts` iterates the schema properties, finds `x-sensitive: true`
fields, and builds the corresponding `uiSchema` entry automatically. The user never needs
to write `uiSchema` manually — it is derived from the schema they provide.

---

## Summary: Final Tech Stack

| Concern              | Choice                          | Package(s)                                      |
|----------------------|---------------------------------|-------------------------------------------------|
| Build / bundler      | Vite 6 + React 18 + TypeScript  | `vite`, `@vitejs/plugin-react`, `typescript`    |
| Form rendering       | RJSF v5 with Mantine theme      | `@rjsf/core`, `@rjsf/mantine`, `@rjsf/utils`   |
| JWE encryption       | jose v6                         | `jose`                                          |
| UI components        | Mantine v7                      | `@mantine/core`, `@mantine/hooks`               |
| Notifications        | Mantine notifications           | `@mantine/notifications`                        |
| JWE output display   | Mantine code highlight          | `@mantine/code-highlight`                       |
| Dark mode toggle     | Mantine color scheme            | included in `@mantine/core`                     |
