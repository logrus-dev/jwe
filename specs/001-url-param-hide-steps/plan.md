# Implementation Plan: URL Parameter Auto-Hide Steps

**Branch**: `001-url-param-hide-steps` | **Date**: 2026-02-24 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-url-param-hide-steps/spec.md`

## Summary

When `?schema=` or `?key=` URL query parameters are present and non-empty on page load, hide the corresponding input card (Step 1 or Step 3 respectively). If both are present, only the data-entry form (Step 2) and encrypted output (Step 4) are visible. Implementation is a single-file change in `src/App.tsx`: two boolean state values initialized synchronously via lazy `useState` initializers (preventing any flash of hidden content), and two conditional renders wrapping the existing Step 1 and Step 3 cards.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: React 18.x (useState, useEffect — already in use)
**Storage**: N/A
**Testing**: N/A (no tests requested in spec)
**Target Platform**: Browser (client-side SPA)
**Project Type**: Web application (static SPA)
**Performance Goals**: Zero layout shift — hidden sections must not render on first paint (SC-004)
**Constraints**: No new files, no new dependencies, no new abstraction layers (Principle III)
**Scale/Scope**: Single component (`src/App.tsx`) — 2 new state declarations + 2 conditional renders

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Client-Side Sovereignty | ✅ PASS | Pure UI change; no server interaction of any kind |
| II. Static Deployment | ✅ PASS | No server-side runtime introduced |
| III. Simplicity (YAGNI) | ✅ PASS | Minimum change: 2 state declarations + 2 JSX conditionals; no new files, no new dependencies, no abstractions |

**Constitution Check post-design**: All principles still pass. The lazy `useState` initializer is a React idiom (not a custom abstraction) and is the minimum mechanism needed to satisfy SC-004 (no FOUC). Complexity Tracking table not required — no violations.

## Project Structure

### Documentation (this feature)

```text
specs/001-url-param-hide-steps/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit.tasks — not created here)
```

### Source Code (only modified file)

```text
src/
└── App.tsx   ← ONLY file changed (2 state declarations + 2 JSX conditionals)
```

No new files. No changes to `src/utils/urlParams.ts` — it already returns
`{ schema: string | null, key: string | null }` which is exactly what is needed.

## Implementation Design

### Visibility Flags

Add two boolean state values near the top of `App()`, after existing `useState` declarations:

```tsx
// Synchronous lazy initializers — computed on first render, never updated.
// Prevents any flash of hidden content (SC-004).
const [schemaFromUrl] = useState(() => {
  const p = readUrlParams();
  return p.schema !== null && p.schema !== '';
});
const [keyFromUrl] = useState(() => {
  const p = readUrlParams();
  return p.key !== null && p.key !== '';
});
```

`readUrlParams()` reads `window.location.search` — a synchronous, side-effect-free call.
The lazy initializer runs during the first render, before the browser paints, so no FOUC occurs.
The setter is intentionally omitted (no `setSchemaFromUrl`) — values are fixed for the session
per FR-008 and spec Assumptions.

### Conditional Rendering

Wrap the Step 1 card (lines 170–184 in current `App.tsx`):

```tsx
{!schemaFromUrl && (
  <Card withBorder shadow="sm" radius="md" padding="lg">
    {/* Step 1: Schema */}
    ...
  </Card>
)}
```

Wrap the Step 3 card (lines 204–216 in current `App.tsx`):

```tsx
{!keyFromUrl && (
  <Card withBorder shadow="sm" radius="md" padding="lg">
    {/* Step 3: Public Key */}
    ...
  </Card>
)}
```

### Existing `useEffect` is Unchanged

The `useEffect` that calls `readUrlParams()` and pre-populates `schemaRaw`/`keyState`
continues to run unchanged. The two concerns are separate:

- **Visibility** (sync, no FOUC): `useState` lazy initializers → `schemaFromUrl` / `keyFromUrl`
- **Value pre-loading** (async-capable): `useEffect` → sets `schemaRaw`, `schemaState`, `keyState`

This separation avoids restructuring the existing effect and keeps each concern minimal.

### Error Banners Remain Visible

The URL error banners (`urlErrors.schema`, `urlErrors.key`) are rendered before the step cards
and are not affected by `schemaFromUrl`/`keyFromUrl`. Per FR-006 and FR-007, errors are shown
inline even when the corresponding section is hidden.

## Complexity Tracking

No violations. No entry required.
