# Tasks: Azure Static Web App Deployment

**Input**: Design documents from `/specs/001-azure-static-deploy/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅, quickstart.md ✅

**Tests**: No test tasks generated — spec does not request TDD. Verification steps are in the Polish phase.

**Organization**: Tasks are grouped by user story. US1 (automated deployment) is independently deliverable as MVP. US2 (SPA routing) and US3 (PR previews) layer on top.

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

---

## Phase 1: Setup (ESLint Tooling)

**Purpose**: Add ESLint so the `npm run lint` gate required by FR-006 exists before the workflow tries to call it. Both tasks can proceed as soon as Phase 1 begins.

- [x] T001 Edit `package.json` to add ESLint devDependencies (`eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-react-hooks`), add `"lint": "eslint src --ext .ts,.tsx"` to `scripts`, and add `"engines": { "node": ">=20.0.0" }` at the top level
- [x] T002 [P] Create `.eslintrc.cjs` at the repo root with `@typescript-eslint/recommended` and `react-hooks` rules enabled, `parser: "@typescript-eslint/parser"`, `parserOptions: { ecmaVersion: "latest", sourceType: "module" }`
- [x] T003 Run `npm install` in the repo root to install the ESLint devDependencies added in T001 and update `package-lock.json`

---

## Phase 2: Foundational (Manual Azure Prerequisite)

**Purpose**: The Azure SWA resource and GitHub secret must exist before any deployment can succeed. This is a manual step per spec Assumptions (resource provisioning is out of scope for automation).

**⚠️ CRITICAL**: The deployment workflow (Phase 3) will fail without `AZURE_STATIC_WEB_APPS_API_TOKEN` being set.

- [ ] T004 ⚠️ MANUAL — Follow `specs/001-azure-static-deploy/quickstart.md` Steps 1–3: provision an Azure Static Web App resource (Free tier), retrieve the deployment token from the Azure portal, and add it as `AZURE_STATIC_WEB_APPS_API_TOKEN` in the GitHub repository's **Settings → Secrets and variables → Actions**

**Checkpoint**: Azure resource provisioned + secret set — US1 deployment can now succeed

---

## Phase 3: User Story 1 - Developer Deploys Application (Priority: P1) 🎯 MVP

**Goal**: A push to `main` triggers the CI/CD pipeline which runs typecheck + lint + build, then deploys the pre-built `dist/` to Azure Static Web Apps. A failed build leaves the live site unchanged.

**Independent Test**: Push any change to `main`; verify the Actions workflow appears in the GitHub Actions tab, all steps pass, and the app is accessible at the Azure SWA URL (follow quickstart.md Steps 5–6).

### Implementation for User Story 1

- [x] T005 [US1] Create `.github/workflows/azure-static-web-apps.yml` with a `push` trigger on `main` branch only; a `build_and_deploy` job using `ubuntu-latest` that runs: `actions/checkout@v4`, `actions/setup-node@v4` (node-version: '20', cache: 'npm'), `npm ci`, `npm run typecheck`, `npm run lint`, `npm run build`, then `Azure/static-web-apps-deploy@v1` with `azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}`, `repo_token: ${{ secrets.GITHUB_TOKEN }}`, `action: "upload"`, `app_location: "/"`, `api_location: ""`, `output_location: "dist"`, `skip_app_build: true`, `skip_api_build: true`

**Checkpoint**: US1 complete — push to `main` triggers automated deployment with typecheck/lint gates

---

## Phase 4: User Story 2 - User Accesses Application via Direct Link (Priority: P2)

**Goal**: All application URLs (including `?schema=...&key=...` query parameters) return 200 and load the app correctly on direct navigation, bookmarks, and hard refresh. JS/CSS assets are served with correct MIME types and optimal cache headers.

**Independent Test**: After deploying, open a fresh browser tab and navigate directly to the Azure SWA URL with `?schema=<valid-encoded-schema>&key=<valid-jwk>` appended; the JWE form must load and pre-populate without a 404 or blank screen.

### Implementation for User Story 2

- [x] T006 [US2] Create `public/staticwebapp.config.json` (Vite copies `public/` to `dist/` on build) with:
  - `navigationFallback`: `rewrite: "/index.html"`, `exclude: ["/assets/*", "*.js", "*.mjs", "*.css", "*.ico", "*.png", "*.svg", "*.jpg", "*.jpeg", "*.gif", "*.webp", "*.woff", "*.woff2", "*.ttf", "*.eot", "*.webmanifest", "*.map"]`
  - `routes`: `/index.html` → `Cache-Control: no-store`; `/assets/*.js` and `/assets/*.mjs` and `/assets/*.css` and `/assets/*` → `Cache-Control: public, max-age=31536000, immutable`; `/*.svg` and `/*.ico` → `Cache-Control: public, max-age=86400`; `/*.webmanifest` → `Cache-Control: no-cache`
  - `globalHeaders`: `Strict-Transport-Security: max-age=31536000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()`, `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`
  - `mimeTypes`: `.js` → `application/javascript`, `.mjs` → `application/javascript`, `.css` → `text/css`, `.svg` → `image/svg+xml`, `.webmanifest` → `application/manifest+json`

**Checkpoint**: US2 complete — deploy with the new config and verify direct-URL navigation returns 200 with correct content

---

## Phase 5: User Story 3 - Pull Request Preview Deployment (Priority: P3)

**Goal**: Opening a PR against `main` creates an isolated preview environment with a unique URL posted as a PR comment. Closing or merging the PR automatically removes the preview environment.

**Independent Test**: Open a test PR against `main`; verify a bot comment with a preview URL appears and the app loads at that URL. Merge or close the PR; verify the preview URL becomes inaccessible.

### Implementation for User Story 3

- [x] T007 [US3] Extend `.github/workflows/azure-static-web-apps.yml` (included in T005 — complete workflow written upfront): add `pull_request` trigger with `types: [opened, synchronize, reopened, closed]` and `branches: [main]`; update the `build_and_deploy` job's `if` condition to `github.event_name == 'push' || (github.event_name == 'pull_request' && github.event.action != 'closed')`; add a new `close_pull_request` job with `if: github.event_name == 'pull_request' && github.event.action == 'closed'` that uses `Azure/static-web-apps-deploy@v1` with `azure_static_web_apps_api_token: ${{ secrets.AZURE_STATIC_WEB_APPS_API_TOKEN }}` and `action: "close"`

**Checkpoint**: US3 complete — all three user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Local verification, smoke tests, and confirming end-to-end behaviour before declaring the feature done.

- [x] T008 [P] Run `npm run lint` locally in the repo root; verify it exits with code 0 and reports no violations in `src/`
- [x] T009 [P] Run `npm run typecheck` locally in the repo root; verify it exits with code 0 with no TypeScript errors
- [x] T010 [P] Run `npm run build` locally; verify `dist/` is produced and `dist/staticwebapp.config.json` exists (confirms Vite copied it from `public/`)
- [ ] T011 ⚠️ MANUAL — Push the complete feature branch changes to `main` (or merge the PR); verify the Actions workflow reaches the Deploy step and completes successfully; visit the Azure SWA production URL and confirm the JWE form loads
- [ ] T012 ⚠️ MANUAL — Follow quickstart.md Step 7: open a test PR against `main`, verify the GitHub Actions bot posts a preview URL comment, visit the URL, confirm the app loads. Then close the PR and verify the preview environment is cleaned up.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 complete (needs `npm install` done before verifying lint works locally). **Manual step** — blocks Phase 3 deployment success (not implementation)
- **Phase 3 (US1)**: Requires Phase 1 complete (lint script must exist). Phase 2 (Azure secret) required for the workflow to actually succeed in CI.
- **Phase 4 (US2)**: Requires Phase 3 complete (needs a deployed app to test routing against)
- **Phase 5 (US3)**: Requires Phase 3 complete (extends the same workflow file created in T005)
- **Phase 6 (Polish)**: Requires Phases 3–5 complete

### User Story Dependencies

- **US1 (P1)**: Depends only on Phase 1 complete — start immediately after setup
- **US2 (P2)**: Independent of US3; can proceed in parallel with US3 after US1 is done
- **US3 (P3)**: Independent of US2; can proceed in parallel with US2 after US1 is done

### Within Each Phase

- T001 must complete before T003 (npm install requires package.json changes)
- T002 can run in parallel with T001 (different file)
- T005 (US1 workflow) must complete before T007 (US3 extends the same file)
- T006 (US2 config) can run in parallel with T007 (different files)

### Parallel Opportunities

- **Phase 1**: T001 and T002 can run in parallel (different files: `package.json` vs `.eslintrc.cjs`)
- **Phase 4 + 5**: T006 and T007 can run in parallel (different files: `public/staticwebapp.config.json` vs `.github/workflows/azure-static-web-apps.yml`)
- **Phase 6**: T008, T009, T010, T012 can all run in parallel

---

## Parallel Example: Phase 1

```
Start both together:
  Task A: T001 — Edit package.json (ESLint deps + lint script + engines)
  Task B: T002 — Create .eslintrc.cjs

Then sequentially:
  Task C: T003 — npm install (depends on T001)
```

## Parallel Example: Phase 4 + 5

```
Start both together after T005 (US1 workflow) is complete:
  Task A: T006 — Create public/staticwebapp.config.json (US2)
  Task B: T007 — Extend .github/workflows/azure-static-web-apps.yml (US3)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: ESLint setup (T001–T003)
2. Complete Phase 2: Azure resource + secret (T004)
3. Complete Phase 3: GitHub Actions workflow (T005)
4. **STOP and VALIDATE**: Push to `main`, verify deployment succeeds and app is live
5. Ship if ready (US2 and US3 can follow)

### Incremental Delivery

1. Phase 1 + Phase 2 → ESLint tooling and Azure resource ready
2. US1 (T005) → Automated deployment live. App publicly accessible. ✅ **MVP**
3. US2 (T006) → SPA routing fixed. Direct URLs and query params work. ✅ **Feature complete for end users**
4. US3 (T007) → PR previews enabled. Developer workflow complete. ✅ **Full feature**
5. Phase 6 → Verified end-to-end ✅

### Single Developer

Work sequentially: Phase 1 → Phase 2 → US1 → US2 → US3 → Polish. Each phase is a natural commit point.

---

## Notes

- No new `src/` files are touched — all changes are configuration/infrastructure
- `public/staticwebapp.config.json` is the only new file in the Vite project tree
- After T005 is committed, pushing to `main` will attempt a real deployment — ensure T004 (Azure secret) is done first or the workflow will fail (existing site unaffected)
- `skip_app_build: true` is critical — without it, Oryx re-runs `npm run build` and may produce a different output or fail on a Node version mismatch
- The `api_location: ""` (explicit empty string) must be set — omitting it causes Oryx to scan for an API directory
