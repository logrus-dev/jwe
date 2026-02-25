# Tasks: Base64URL-Encoded URL Parameters

**Input**: Design documents from `/specs/001-base64url-params/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, quickstart.md

**Tests**: Not requested — no test tasks generated.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths included in all descriptions

## Path Conventions

Single project layout — all source under `src/` at repository root.

---

## Phase 1: Setup

*Not applicable — existing project. No new infrastructure required.*

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the `decodeBase64UrlParam` utility that both user stories depend on.

**⚠️ CRITICAL**: Both user story phases depend on these tasks completing first.

- [x] T001 Add `DecodeResult` discriminated union type to `src/utils/urlParams.ts`: `type DecodeResult = { value: string; error: null } | { value: null; error: string }`
- [x] T002 Implement `decodeBase64UrlParam(raw: string): DecodeResult` in `src/utils/urlParams.ts` using RFC 4648 §5: swap `-`→`+` and `_`→`/`, add `=` padding via `'='.repeat((4 - raw.length % 4) % 4)`, call `atob()`, decode UTF-8 via `new TextDecoder().decode(Uint8Array.from(latin1, c => c.charCodeAt(0)))`, return `{ value, error: null }` on success or `{ value: null, error: 'Invalid base64url encoding' }` on any caught exception (depends on T001)

**Checkpoint**: `decodeBase64UrlParam` exported from `src/utils/urlParams.ts`; `npm run typecheck` passes.

---

## Phase 3: User Story 1 — Open Pre-configured Form via Shared URL (Priority: P1) 🎯 MVP

**Goal**: A URL with valid base64url-encoded `?schema=` and `?key=` params pre-populates both input fields on page load with no user interaction.

**Independent Test**: Construct a URL with `?schema=<base64url-of-json-schema>&key=<base64url-of-jwk>` using the `toBase64Url()` snippet in `specs/001-base64url-params/quickstart.md`. Open the URL — both fields must be pre-populated.

### Implementation for User Story 1

- [x] T003 [US1] In `src/App.tsx` `useEffect`, update the schema branch: import `decodeBase64UrlParam` from `./utils/urlParams`, replace the direct `parseSchema(params.schema)` call with `const schemaDecode = decodeBase64UrlParam(params.schema); if (schemaDecode.error) { errors.schema = schemaDecode.error; } else { const result = parseSchema(schemaDecode.value); ... }` (depends on T002)
- [x] T004 [US1] In `src/App.tsx` `useEffect`, update the key branch: replace the direct `validateAndImportKey(params.key)` call with `const keyDecode = decodeBase64UrlParam(params.key); if (keyDecode.error) { setUrlErrors(prev => ({ ...prev, key: keyDecode.error! })); } else { validateAndImportKey(keyDecode.value).then(...).catch(...) }` (depends on T002, sequential after T003 to avoid edit conflicts in the same useEffect)

**Checkpoint**: `npm run typecheck` passes. Opening a URL with valid base64url params pre-populates both fields.

---

## Phase 4: User Story 2 — Graceful Handling of Invalid Encoded Parameters (Priority: P2)

**Goal**: Malformed or corrupted base64url URL parameter values produce a visible error alert; the affected input remains empty.

**Independent Test**: Append `?schema=!!!invalid!!!` to the dev URL — a red error alert titled "URL schema parameter is invalid" must appear and the schema field must remain empty. Repeat with `?key=!!!invalid!!!` for the key field.

**Note**: The error-handling code for US2 is already embedded in T003 and T004 (the `if (decode.error)` branches). This phase validates that the error paths work correctly and verifies the error alert wording.

### Implementation for User Story 2

- [x] T005 [US2] Verify in `src/App.tsx` that the schema decode-error branch (from T003) sets `errors.schema` with the message from `schemaDecode.error` and that the existing Alert component at line ~158 displays "URL schema parameter is invalid" as its title (no code change expected — this is a review and confirmation task)
- [x] T006 [US2] Verify in `src/App.tsx` that the key decode-error branch (from T004) calls `setUrlErrors` with `key: keyDecode.error` and that the existing Alert at line ~169 displays "URL key parameter is invalid" as its title (no code change expected — review and confirmation task)

**Checkpoint**: Both error alert paths confirmed. Opening a URL with invalid base64url in either param shows the appropriate alert and leaves the field empty.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Validate code quality and manual verification against acceptance scenarios.

- [x] T007 [P] Run `npm run typecheck` from repo root and confirm zero TypeScript errors
- [x] T008 [P] Run `npm run lint` from repo root and confirm zero ESLint errors
- [x] T009 Run `npm run build` from repo root and confirm clean static build output in `dist/`
- [ ] T010 Manual verification: test all scenarios listed in the Verification Checklist in `specs/001-base64url-params/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **User Story 1 (Phase 3)**: Depends on T001 + T002 (Foundational complete)
- **User Story 2 (Phase 4)**: Depends on T003 + T004 (US1 implementation complete — error branches are embedded there)
- **Polish (Phase 5)**: Depends on all implementation phases complete

### User Story Dependencies

- **US1 (P1)**: Unblocks after Foundational. Standalone — no dependency on US2.
- **US2 (P2)**: Unblocks after US1 (code review of error branches added in T003/T004).

### Within Each Phase

- T001 → T002 (sequential: type must exist before function implementation)
- T002 → T003 → T004 (sequential: utility first, then App.tsx schema branch, then key branch)
- T007, T008 are [P]: both read-only checks, no file conflicts

### Parallel Opportunities

- T007 and T008 (typecheck + lint) can run in parallel.
- No other parallelism in this feature — all implementation touches are sequential to avoid conflicts in the same file.

---

## Parallel Example: Foundational Phase

```
# These are sequential (T001 must complete before T002):
T001: Add DecodeResult type to src/utils/urlParams.ts
  ↓
T002: Implement decodeBase64UrlParam() in src/utils/urlParams.ts

# After T002, US1 tasks are sequential in the same useEffect:
T003: Update schema branch in App.tsx useEffect
  ↓
T004: Update key branch in App.tsx useEffect
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational (T001, T002)
2. Complete Phase 3: User Story 1 (T003, T004)
3. **STOP and VALIDATE**: Open a URL with valid base64url params — confirm both fields pre-populate
4. Deploy/demo if ready

### Incremental Delivery

1. Foundational (T001–T002) → utility function ready
2. US1 (T003–T004) → happy path works → demo with `quickstart.md` URL
3. US2 (T005–T006) → error paths confirmed → full feature complete
4. Polish (T007–T010) → clean build, all scenarios verified

---

## Notes

- No new files to create — only `src/utils/urlParams.ts` and `src/App.tsx` are modified
- No new npm dependencies — uses only browser-native `atob()` and `TextDecoder`
- `readUrlParams()` is **not** changed — step-hiding logic in lazy initializers remains based on raw param presence
- Breaking change: previously shared plain-text URLs will no longer work (per spec decision A)
- See `specs/001-base64url-params/quickstart.md` for test URL generation and migration note
