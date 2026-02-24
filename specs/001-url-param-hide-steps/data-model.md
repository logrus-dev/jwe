# Data Model: URL Parameter Auto-Hide Steps

**Feature**: `001-url-param-hide-steps`
**Date**: 2026-02-24

## Overview

This feature introduces no new data entities, no new storage, and no new data flows.
It derives two boolean flags from the existing `UrlParams` type that is already
parsed on mount.

## Derived State

### Visibility Flags (new, in `App.tsx`)

| Field | Type | Source | Invariant |
|-------|------|--------|-----------|
| `schemaFromUrl` | `boolean` | `readUrlParams().schema !== null && !== ''` | Read-only for session lifetime |
| `keyFromUrl` | `boolean` | `readUrlParams().key !== null && !== ''` | Read-only for session lifetime |

These are not stored externally, not serialised, and not passed to child components.
They exist solely to gate JSX conditional rendering in `App.tsx`.

## Existing Type (unchanged)

```ts
// src/utils/urlParams.ts
export interface UrlParams {
  schema: string | null;  // null = absent; "" = present but empty
  key: string | null;
}
```

`null` and `""` both map to `false` for the visibility flags, satisfying the spec
Assumption that an empty param value is treated identically to the param being absent.

## State Transitions

```
Page load
  └─ readUrlParams() called synchronously (useState lazy initializer)
       ├─ schema present & non-empty  →  schemaFromUrl = true  →  Step 1 card NOT rendered
       ├─ schema absent or empty      →  schemaFromUrl = false →  Step 1 card rendered normally
       ├─ key present & non-empty     →  keyFromUrl = true     →  Step 3 card NOT rendered
       └─ key absent or empty         →  keyFromUrl = false    →  Step 3 card rendered normally

Session lifetime
  └─ schemaFromUrl and keyFromUrl do not change (URL does not change in SPA)
```

## No New Entities

No models, services, database schemas, or API contracts are introduced.
The feature is purely a UI rendering concern.
