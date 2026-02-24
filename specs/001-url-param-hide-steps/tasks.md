# Tasks: URL Parameter Auto-Hide Steps

**Input**: Design documents from `/specs/001-url-param-hide-steps/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: No test tasks generated — spec does not request TDD.

**Organization**: All three user stories are implemented by the same three changes in
`src/App.tsx`. US1 (both hidden) is the primary phase; US2 and US3 are subset scenarios
covered by those same changes and require no additional implementation tasks.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

No setup required — no new dependencies, no new files, no configuration changes.
Proceed directly to implementation.

---

## Phase 2: User Story 1 - Focused Encrypt Mode: Both Parameters Pre-Filled (Priority: P1) 🎯 MVP

**Goal**: When both `?schema=` and `?key=` URL parameters are present and non-empty,
only the data-entry form (Step 2) and encrypted output (Step 4) are visible. Step 1
(schema input) and Step 3 (key input) cards are not rendered — no flash on first paint.

**Independent Test**: Open `http://localhost:5173/?schema=<encoded>&key=<encoded>` in a
fresh browser tab. Verify in DevTools Elements panel that no Step 1 or Step 3 card
exists in the DOM. Verify Step 2 form and Step 4 encrypt card are present and functional.

### Implementation for User Story 1

- [x] T001 [US1] In `src/App.tsx`, add two `useState` lazy initializer declarations
  after the existing `useState` calls (before the `useEffect`):
  ```tsx
  const [schemaFromUrl] = useState(() => {
    const p = readUrlParams();
    return p.schema !== null && p.schema !== '';
  });
  const [keyFromUrl] = useState(() => {
    const p = readUrlParams();
    return p.key !== null && p.key !== '';
  });
  ```
  No setter is declared — values are fixed for the session lifetime (FR-008).

- [x] T002 [US1] In `src/App.tsx`, wrap the Step 1 card in a conditional render so
  it is omitted from the DOM when `schemaFromUrl` is true. The current Step 1 card
  starts at the `{/* Step 1: Schema */}` comment. Change:
  ```tsx
  {/* Step 1: Schema */}
  <Card withBorder shadow="sm" radius="md" padding="lg">
    ...
  </Card>
  ```
  To:
  ```tsx
  {/* Step 1: Schema */}
  {!schemaFromUrl && (
    <Card withBorder shadow="sm" radius="md" padding="lg">
      ...
    </Card>
  )}
  ```

- [x] T003 [US1] In `src/App.tsx`, wrap the Step 3 card in a conditional render so
  it is omitted from the DOM when `keyFromUrl` is true. The current Step 3 card
  starts at the `{/* Step 3: Public Key */}` comment. Change:
  ```tsx
  {/* Step 3: Public Key */}
  <Card withBorder shadow="sm" radius="md" padding="lg">
    ...
  </Card>
  ```
  To:
  ```tsx
  {/* Step 3: Public Key */}
  {!keyFromUrl && (
    <Card withBorder shadow="sm" radius="md" padding="lg">
      ...
    </Card>
  )}
  ```

**Checkpoint**: US1 complete — open URL with both params set; confirm only Step 2 and Step 4 are in the DOM

---

## Phase 3: User Story 2 - Schema Pre-Filled via URL (Priority: P2)

**Goal**: When only `?schema=` is present and non-empty, the schema input card (Step 1)
is hidden while the key input card (Step 3) and form (Step 2) remain visible.

**Independent Test**: Open `http://localhost:5173/?schema=<encoded>` (no `?key=` param).
Verify Step 1 card is absent from the DOM; Step 2, Step 3, Step 4 are visible.

### Implementation for User Story 2

No additional tasks — covered by T001 (schemaFromUrl state) and T002 (Step 1 conditional
render) from Phase 2. US2 is a subset scenario of the same code path.

**Checkpoint**: US2 complete — verify via quickstart.md Scenario 2

---

## Phase 4: User Story 3 - Key Pre-Filled via URL (Priority: P3)

**Goal**: When only `?key=` is present and non-empty, the key input card (Step 3) is
hidden while the schema input card (Step 1) remains visible.

**Independent Test**: Open `http://localhost:5173/?key=<encoded>` (no `?schema=` param).
Verify Step 3 card is absent from the DOM; Step 1, Step 2 (once schema provided),
Step 4 are accessible.

### Implementation for User Story 3

No additional tasks — covered by T001 (keyFromUrl state) and T003 (Step 3 conditional
render) from Phase 2. US3 is a subset scenario of the same code path.

**Checkpoint**: US3 complete — verify via quickstart.md Scenario 3

---

## Phase 5: Polish & Cross-Cutting Concerns

- [x] T004 [P] Run `npm run typecheck` in the repo root; verify it exits with code 0 and reports no TypeScript errors
- [x] T005 [P] Run `npm run lint` in the repo root; verify it exits with code 0 and reports no ESLint violations in `src/`
- [ ] T006 ⚠️ MANUAL — Follow `specs/001-url-param-hide-steps/quickstart.md`: verify all three hiding scenarios (both params, schema only, key only) plus the four edge cases (empty param, invalid schema, invalid key, back/forward navigation)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: N/A — skip
- **Phase 2 (US1)**: No dependencies — start immediately
- **Phase 3 (US2)**: Depends on Phase 2 complete (shares same code changes)
- **Phase 4 (US3)**: Depends on Phase 2 complete (shares same code changes)
- **Phase 5 (Polish)**: Requires Phase 2 complete

### Within Phase 2

- T001 must complete before T002 and T003 (state declarations must exist before JSX references them)
- T002 and T003 both depend on T001 — run sequentially (same file)

### Parallel Opportunities

- **Phase 5**: T004 and T005 can run in parallel (independent shell commands)

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete T001 → T002 → T003 in `src/App.tsx`
2. **STOP and VALIDATE**: Open URL with both params; verify DOM in DevTools
3. Run T004 + T005 (typecheck + lint)
4. US2 and US3 are already covered — run manual verification (T006)

### Single Developer

Work sequentially: T001 → T002 → T003 → T004/T005 (parallel) → T006 (manual).
T001–T003 are all in the same file; a single editor session handles all three.

---

## Notes

- Only `src/App.tsx` is modified — no other files touched
- No new dependencies added
- The existing `useEffect` URL pre-loading logic is unchanged
- `readUrlParams()` is called twice (once per `useState` initializer) — this is
  intentional and acceptable; the function is cheap (single `URLSearchParams` parse)
- Step 2 (dynamic form) is already conditionally rendered by `schemaState.isValid` —
  no change needed; it will still appear only when a valid schema is loaded
