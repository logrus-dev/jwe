---

description: "Task list for Schema-Driven JWE Form Encryptor"
---

# Tasks: Schema-Driven JWE Form Encryptor

**Input**: Design documents from `/specs/001-schema-jwe-form/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, contracts/ui-contract.md ✅, quickstart.md ✅

**Tests**: Not requested — no test tasks generated. Use `quickstart.md` for manual validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and
testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2)
- All file paths are relative to repository root

## Path Conventions

Single project: `src/`, `index.html` at repository root. All source under `src/`.

---

## Phase 1: Setup

**Purpose**: Project initialization — creates the scaffolding that all other phases depend on.

- [x] T001 Initialize Vite + React + TypeScript project at repository root: create `package.json` with scripts (`dev`, `build`, `preview`, `typecheck`), `index.html` as Vite entry point, and `src/` directory as defined in plan.md
- [x] T002 Install all npm production dependencies: `@rjsf/core @rjsf/mantine @rjsf/utils @mantine/core @mantine/hooks @mantine/notifications @mantine/code-highlight @tabler/icons-react jose` and dev dependencies: `vite @vitejs/plugin-react typescript @types/react @types/react-dom postcss postcss-preset-mantine` — Note: resolved to Mantine v8 + RJSF v6 (actual latest versions)
- [x] T003 [P] Configure `vite.config.ts` with `@vitejs/plugin-react` plugin and PostCSS configuration referencing `postcss-preset-mantine` (required for Mantine v8 CSS processing); added manual chunk splitting
- [x] T004 [P] Configure `tsconfig.json` with strict TypeScript mode (`"strict": true`), `"jsx": "react-jsx"`, `moduleResolution: "bundler"`, and path aliases as appropriate for the project structure

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core utilities and app shell that ALL user story components depend on.

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [x] T005 Create the React entry point in `src/main.tsx` (renders `<App/>` wrapped in `MantineProvider` with default theme and `Notifications` component mounted) and stub out `src/App.tsx` with the top-level `Container` layout and a page header
- [x] T006 [P] Implement schema validation and uiSchema derivation utility in `src/utils/schemaUtils.ts`: export `parseSchema(raw: string): SchemaResult` (validates JSON, checks for `properties` key, returns `{parsed, isValid, error}`) and `deriveUiSchema(schema: JSONSchema7): UiSchema` (iterates `schema.properties`, emits `{"ui:widget": "password"}` for any property where `x-sensitive === true`)
- [x] T007 [P] Implement JWE encryption wrapper in `src/utils/encrypt.ts`: export `encryptPayload(data: object, publicKeyJwk: JsonWebKey): Promise<string>` — calls `importJWK(publicKeyJwk, "RSA-OAEP-256")` then `new CompactEncrypt(plaintext).setProtectedHeader({alg: "RSA-OAEP-256", enc: "A256GCM"}).encrypt(key)` using the `jose` package; throws descriptive errors on invalid key or algorithm mismatch
- [x] T008 [P] Implement URL query parameter parser in `src/utils/urlParams.ts`: export `readUrlParams(): {schema: string | null, key: string | null}` — reads `URLSearchParams` from `window.location.search`, returns URL-decoded values for `schema` and `key` params (or `null` if absent)

**Checkpoint**: Foundation ready — utilities and app shell exist. User story implementation can begin.

---

## Phase 3: User Story 1 — Core Encrypt Flow (Priority: P1) 🎯 MVP

**Goal**: A user can manually enter a JSON Schema, fill the rendered form (sensitive fields
masked), enter a JWK public key, click Encrypt, and copy the JWE payload. No URL params needed.

**Independent Test**: Open app with no URL params → enter schema from `quickstart.md` Step 2b →
verify masked and plain fields → enter key from Step 2d → fill form → Encrypt → Copy → decrypt
the payload with the private key and verify field values match.

### Implementation for User Story 1

- [x] T009 [P] [US1] Implement `SchemaInput` component in `src/components/SchemaInput.tsx`: Mantine `Textarea` (monospace, autosize, min 6 rows) for raw schema text; "Render Form" `Button`; `Alert` (red) shown when `schemaState.error` is set; `Alert` (yellow) shown when schema is valid but has no properties; `Badge` (green, "Schema valid") when `schemaState.isValid` is true and has properties; props: `value`, `onChange`, `onRender`, `schemaState`
- [x] T010 [P] [US1] Implement `PublicKeyInput` component in `src/components/PublicKeyInput.tsx`: Mantine `Textarea` (monospace, autosize, min 4 rows) for raw JWK text; calls `importJWK` on blur/change to validate the key; shows `Badge` (green, "Key ready") on success; shows `Badge` (red, error message) on failure; props: `value`, `onChange`, `keyState`, `onKeyStateChange`
- [x] T011 [US1] Implement `DynamicForm` component in `src/components/DynamicForm.tsx`: renders `<Form>` from `@rjsf/mantine` with `schema={schemaState.parsed}`, `uiSchema={derivedUiSchema}` (from `schemaUtils.deriveUiSchema`), `formData`, `onChange`, and `validator` from `@rjsf/validator-ajv8`; hidden when `schemaState.parsed` is null; RJSF handles per-field validation and error display automatically (depends on T006 `schemaUtils.ts`, T009 `SchemaInput`)
- [x] T012 [US1] Implement `EncryptedOutput` component in `src/components/EncryptedOutput.tsx`: "Encrypt" `Button` (disabled when form has errors, key is invalid, or schema absent; shows loading spinner while encrypting); on success renders `@mantine/code-highlight` `CodeHighlight` component with JWE compact string; Mantine `CopyButton` wrapping an `ActionIcon` next to the output for one-click copy with "Copied!" visual feedback; props: `formData`, `keyState`, `schemaState`, `onEncryptError` (depends on T007 `encrypt.ts`)
- [x] T013 [US1] Wire all step components and their shared state into `src/App.tsx`: manage `schemaState`, `uiSchema`, `formData`, `keyState`, and `outputState` with `useState`; render `SchemaInput`, `DynamicForm`, `PublicKeyInput`, and `EncryptedOutput` in a `Stack` of Mantine `Card` components labeled Step 1–4; clear `outputState.value` whenever `schemaState` or `formData` changes (stale output must not persist) (depends on T009, T010, T011, T012)
- [x] T014 [US1] Add schema change confirmation in `src/components/SchemaInput.tsx`: when the user edits the schema textarea after `formData` is non-empty, intercept the "Render Form" button click and show a Mantine `Modal` ("Changing the schema will clear all entered data. Continue?"); on confirm: clear `formData` and render new form; on cancel: revert textarea to previous schema text (depends on T013, which exposes `formData` to `SchemaInput`)
- [x] T015 [US1] Add encryption failure notification in `src/components/EncryptedOutput.tsx` via `@mantine/notifications`: call `notifications.show({color: "red", title: "Encryption failed", message: error.message})` in the `catch` block of the encrypt handler; also add a `notifications.show` call in `PublicKeyInput` for key import failures (depends on T012, T010; `Notifications` component already mounted in T005)

**Checkpoint**: User Story 1 is fully functional and independently testable. Core encrypt flow works end-to-end without any URL params.

---

## Phase 4: User Story 2 — URL Parameter Pre-configuration (Priority: P2)

**Goal**: A URL with `?schema=...&key=...` pre-populates schema and key on page load so recipients
only need to fill the form and click Encrypt.

**Independent Test**: Construct URL per `quickstart.md` Step 3a → open it → verify form is
immediately rendered and key is pre-filled (no user action required) → fill form → Encrypt →
confirm the result is a valid JWE. Also test invalid params (Step 3c, 3d): confirm error banners
appear without breaking the page.

### Implementation for User Story 2

- [x] T016 [US2] Integrate `?schema=` URL param pre-loading in `src/App.tsx`: in a `useEffect` on mount, call `readUrlParams()` from `urlParams.ts`; if `schema` param is present, call `parseSchema(schema)` and set `schemaState`; if valid, also call `deriveUiSchema` and trigger auto-render (same path as clicking "Render Form") — no user interaction required (depends on T008, T013)
- [x] T017 [US2] Integrate `?key=` URL param pre-loading in `src/App.tsx`: in the same mount `useEffect` as T016, if `key` param is present, set `keyState.raw` and call `importJWK` to validate and store the `CryptoKey`; set `keyState.isValid` and `keyState.error` accordingly (depends on T008, T016)
- [x] T018 [US2] Implement dismissible URL param error banners in `src/App.tsx`: if `?schema=` param was present but invalid on mount, render a dismissible Mantine `Alert` (red, "URL schema parameter is invalid: [detail]") at the top of the page; similarly for `?key=`; both alerts are independently dismissible; valid params are still applied even if the other param is invalid (depends on T016, T017)

**Checkpoint**: User Stories 1 AND 2 are independently functional. Pre-configured URLs work end-to-end.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements applying to both user stories — final quality pass.

- [x] T019 [P] Update `index.html` with descriptive `<title>JWE Form Encryptor</title>`, `<meta name="description">` ("Client-side form encryptor using JSON Schema and JWE"), and a favicon reference (`/favicon.svg`)
- [x] T020 [P] Add dark mode toggle to the app header in `src/App.tsx`: Mantine `ActionIcon` using `useMantineColorScheme` hook; toggles between `"light"` and `"dark"`; uses `@tabler/icons-react` `IconSun` / `IconMoon` icons; `ColorSchemeScript` added to `index.html` `<head>` to prevent flash
- [x] T021 Wrap the `App.tsx` content in a Mantine `Container` with `size="md"` (max-width ~860px) and appropriate top/bottom padding (`py="xl"`) for responsive centered layout on all screen sizes
- [ ] T022 Run `quickstart.md` end-to-end validation: execute all 7 scenario groups (invalid schema, valid schema with sensitive fields, required field validation, encrypt + copy, URL pre-config, decryptability, network panel check); confirm all pass; fix any failures before marking complete

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001–T004) — **BLOCKS all user stories**
- **User Story 1 (Phase 3)**: Depends on Foundational completion — no dependency on US2
- **User Story 2 (Phase 4)**: Depends on User Story 1 completion (T013 app state must exist)
- **Polish (Phase 5)**: Depends on both user stories being complete

### User Story Dependencies

- **US1 (P1)**: Can start after Phase 2 — fully independent
- **US2 (P2)**: Depends on US1 (reads URL params into the same App state established in T013)

### Within Each Phase

- T009 and T010: Fully parallel (different component files)
- T011: Depends on T006 (needs `schemaUtils`) and can start after T009 exists as a stub
- T012: Depends on T007 (needs `encrypt.ts`)
- T013: Depends on T009, T010, T011, T012 (wires all together)
- T014: Depends on T013 (needs `formData` prop from App)
- T015: Depends on T012 and T010 (adds notifications to existing handlers)
- T016 + T017: Must be sequential (both edit `src/App.tsx`); T016 first, T017 second
- T018: Depends on T016 and T017

### Parallel Opportunities

```bash
# Phase 1: Run all in parallel
Task: "T003 Configure vite.config.ts"
Task: "T004 Configure tsconfig.json"

# Phase 2: Run T006, T007, T008 in parallel after T005 is done
Task: "T006 Implement schemaUtils.ts"
Task: "T007 Implement encrypt.ts"
Task: "T008 Implement urlParams.ts"

# Phase 3: Run T009 and T010 in parallel
Task: "T009 Implement SchemaInput component"
Task: "T010 Implement PublicKeyInput component"

# Phase 5: Run T019 and T020 in parallel
Task: "T019 Update index.html"
Task: "T020 Add dark mode toggle"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T004)
2. Complete Phase 2: Foundational (T005–T008) — **CRITICAL: blocks everything**
3. Complete Phase 3: User Story 1 (T009–T015)
4. **STOP and VALIDATE**: Run quickstart.md Steps 2a–2f; confirm core encrypt flow works
5. Deploy/demo if ready — a fully functional encryptor without URL params is already useful

### Incremental Delivery

1. Setup + Foundational → project compiles, app renders empty shell
2. User Story 1 → Test independently → Full encrypt flow works (MVP!)
3. User Story 2 → Test independently → URL pre-configuration works
4. Polish → Final visual pass and quickstart.md validation

---

## Notes

- `[P]` tasks = different files, no blocking dependencies — safe to work in parallel
- `[Story]` label maps each task to its user story for traceability
- T006 (`schemaUtils.ts`) is the most critical utility — DynamicForm depends on it
- T007 (`encrypt.ts`) should be implemented as a pure async function for easy testing
- RJSF validation (required fields, type checking) is automatic — no manual validation code needed
- Mantine's `CopyButton` handles clipboard fallback (text selection) automatically
- `@rjsf/validator-ajv8` is the recommended RJSF v5 validator — install alongside `@rjsf/core`
