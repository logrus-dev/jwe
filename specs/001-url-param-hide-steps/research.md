# Research: URL Parameter Auto-Hide Steps

**Feature**: `001-url-param-hide-steps`
**Date**: 2026-02-24
**Status**: Complete — no external research required

## Summary

No external dependencies or unknowns. The existing codebase already provides all
needed infrastructure. All decisions were resolved through direct code inspection.

---

## Decision 1: How to prevent flash of hidden content (FOUC) — SC-004

**Context**: SC-004 requires that all three hiding scenarios activate on first page
load with no visible flash before hiding occurs. React's default `useEffect` fires
*after* the first paint, which would cause a brief flash of the Step 1 and Step 3
cards before they are hidden.

**Decision**: Use React's lazy `useState` initializer to compute visibility booleans
synchronously during the first render, before the browser paints.

```tsx
const [schemaFromUrl] = useState(() => {
  const p = readUrlParams();
  return p.schema !== null && p.schema !== '';
});
```

**Rationale**: `useState` with a function initializer runs synchronously during render.
React batches state and renders the initial output before committing to the DOM, so
the cards are never added to the DOM when they should be hidden. This is a standard
React idiom with zero additional abstraction or dependency.

**Alternatives considered**:
- `useEffect` + state setter: Rejected — fires after paint, causes FOUC.
- `useLayoutEffect`: Rejected — synchronous but fires after DOM mutation, still shows
  a flash; also suppressed in SSR environments (no benefit here).
- Module-level constants outside the component: Rejected — violates React's
  encapsulation model; prevents testing/mocking.

---

## Decision 2: Reuse `readUrlParams()` vs. inline `URLSearchParams`

**Decision**: Reuse the existing `readUrlParams()` from `src/utils/urlParams.ts`.

**Rationale**: The function is already imported in `App.tsx`. Calling it a second time
(in the lazy initializer) is cheap (single `URLSearchParams` parse) and avoids
duplicating the param name strings `'schema'` and `'key'`.

**Alternatives considered**:
- Inline `new URLSearchParams(window.location.search).get('schema')`: Rejected —
  duplicates the param name literals; divergence risk if param names ever change.

---

## Decision 3: Omit the setter from visibility state

**Decision**: Declare `const [schemaFromUrl] = useState(...)` with no setter.

**Rationale**: Per FR-008 and spec Assumption 3, hidden sections must never be revealed
during the session. The URL is the sole configuration source and does not change
(SPA, no navigation). Omitting the setter makes this invariant explicit and
enforced at the type level — no code path can accidentally show a hidden section.

**Alternatives considered**:
- Include setter and never call it: Rejected — leaves an unused escape hatch,
  violates Principle III (YAGNI).

---

## Decision 4: Keep `useEffect` URL loading unchanged

**Decision**: The existing `useEffect` that calls `readUrlParams()` and pre-populates
schema text / key state is not modified.

**Rationale**: Value pre-loading (setting `schemaRaw`, `schemaState`, `keyState`) and
visibility control are independent concerns. Merging them would require restructuring
the effect for no benefit. Two separate reads of `readUrlParams()` is acceptable given
the function's trivial cost.

---

## Code Inspection Findings

| File | Relevant Finding |
|------|-----------------|
| `src/utils/urlParams.ts` | Returns `{ schema: string\|null, key: string\|null }`. `params.get()` returns `null` when absent, `""` when present-but-empty. Both cases should show the input section (spec Assumption 4). |
| `src/App.tsx` line 170–184 | Step 1 card wraps `<SchemaInput>`. Entire `<Card>` element must be conditionally rendered. |
| `src/App.tsx` line 204–216 | Step 3 card wraps `<PublicKeyInput>`. Entire `<Card>` element must be conditionally rendered. |
| `src/App.tsx` line 61–93 | Existing `useEffect` calls `readUrlParams()` and pre-loads values — no changes needed. |
| `src/App.tsx` line 146–167 | Error banners rendered before step cards — unaffected by hide logic, satisfying FR-006/FR-007. |
