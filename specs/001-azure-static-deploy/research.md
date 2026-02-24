# Research: Azure Static Web App Deployment

**Feature**: `001-azure-static-deploy`
**Date**: 2026-02-23
**Status**: Complete — all unknowns resolved

---

## Decision 1: CI/CD Mechanism

**Decision**: GitHub Actions using `Azure/static-web-apps-deploy@v1`

**Rationale**: The spec assumes GitHub as the repository host (see spec Assumptions). GitHub Actions is the only deployment mechanism that supports automatic PR preview environments for Azure SWA — Azure DevOps requires manual named-environment configuration and does not support PR previews automatically.

**Alternatives considered**: Azure DevOps pipelines — rejected because PR preview environments require manual setup and the project uses GitHub.

---

## Decision 2: Build Strategy — Pre-built vs. Oryx-built

**Decision**: Pre-build in the workflow (run `npm ci`, `typecheck`, `lint`, `build`) then deploy with `skip_app_build: true`.

**Rationale**:
- Spec FR-006 requires typecheck and lint to gate deployment. These steps must run before the build; Oryx's built-in `npm run build` cannot be gated by pre-checks without an additional workaround.
- The Oryx builder (Azure's automatic build system) has a documented Node.js version mismatch problem — it may pick a different Node version than the project requires, causing Vite 6 failures. Using `actions/setup-node@v4` with an explicit version eliminates this risk.
- `skip_app_build: true` tells the action "the build is already done; just upload `output_location`." Without it, Oryx re-runs `npm run build` in a container, ignoring the pre-built `dist/` and potentially producing a different output.
- `api_location` must be set to `""` (explicit empty string) rather than omitted; omitting it causes Oryx to scan for an API directory.

**Alternatives considered**: Let Oryx handle the build — rejected because of Node version mismatch risk and inability to run typecheck/lint before the build.

---

## Decision 3: SPA Routing Fallback Mechanism

**Decision**: `navigationFallback` in `staticwebapp.config.json`, NOT a catch-all `"route": "/*"` rewrite.

**Rationale**: This is the single most critical Vite-on-SWA configuration decision.

A catch-all route in `routes` (`"route": "/*", "rewrite": "/index.html"`) is applied before the filesystem is checked. This means requests for `/assets/main-abc123.js` are rewritten to `/index.html` and served with `Content-Type: text/html`. Browsers refuse to execute scripts with the wrong MIME type, causing a blank page / broken app. This is the most-reported Vite SWA issue.

`navigationFallback` is applied **after** the filesystem check — real files (JS/CSS bundles, images) are served directly; only unresolvable paths fall back to `index.html`. An `exclude` list prevents the fallback from triggering for known asset patterns.

**Query string preservation**: The fallback returns `index.html` and leaves the browser URL (including `?schema=...&key=...`) unchanged. React reads query parameters on mount from the unchanged URL. The app's `urlParams.ts` utility works correctly on direct navigation and hard refresh.

**Alternatives considered**: Explicit `routes` catch-all — rejected as it breaks Vite asset serving.

---

## Decision 4: `staticwebapp.config.json` File Placement

**Decision**: `public/staticwebapp.config.json` (Vite's public directory).

**Rationale**: Vite copies everything in `public/` to the root of `dist/` verbatim during `npm run build`. Azure SWA reads `staticwebapp.config.json` from the root of `output_location` (`dist/`). Placing it in `public/` means Vite's own build process handles the copy — no extra CI steps required.

The alternative (repo root, relying on the SWA action to copy it from `app_location` to `dist/`) has been reported as inconsistent in community issues. The `public/` approach is more reliable.

**Alternatives considered**: Repo root with action-based copy — rejected due to inconsistent behavior reports.

---

## Decision 5: Cache-Control Strategy

**Decision**: Differentiated caching via per-route headers in `staticwebapp.config.json`:
- `index.html` → `Cache-Control: no-store`
- `/assets/*` (hashed JS/CSS) → `Cache-Control: public, max-age=31536000, immutable`
- Static files in `public/` (favicon, SVG) → `Cache-Control: public, max-age=86400`

**Rationale**: Azure SWA's default `Cache-Control: must-revalidate, max-age=30` causes unnecessary bandwidth on hashed assets that cannot change at the same URL. Vite's content-addressed output (`main-a1b2c3.js`) is designed for indefinite caching. `index.html` must never be cached stale because it references the hashed bundles; `no-store` is chosen over `no-cache` because `no-cache` has inconsistent behavior on iOS Safari.

**Alternatives considered**: Default 30-second cache — rejected as wasteful; `no-cache` on index.html — rejected due to iOS Safari inconsistency.

---

## Decision 6: MIME Type Explicit Declaration

**Decision**: Add `mimeTypes` section to `staticwebapp.config.json` for `.js` and `.mjs` → `application/javascript`.

**Rationale**: Azure SWA has documented MIME detection bugs for `.mjs` files and occasionally `.js` files in Vite builds. Explicit declaration prevents the platform from falling back to incorrect MIME detection.

---

## Decision 7: Security Headers

**Decision**: Set via `globalHeaders` in `staticwebapp.config.json`:
- `Strict-Transport-Security: max-age=31536000; includeSubDomains` (defense-in-depth; platform enforces HTTPS already)
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()`
- `Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'`

**Rationale**:
- HTTPS is automatic on Azure SWA (platform-enforced, cannot be disabled). HSTS header is additive defense.
- `style-src 'unsafe-inline'` is required: Mantine uses Emotion for CSS-in-JS, which injects `<style>` tags at runtime.
- `connect-src 'self'` is sufficient: all JWE encryption runs in-browser via `jose`; no external API calls.
- `frame-ancestors 'none'` combined with `X-Frame-Options: DENY` covers both modern and legacy browsers.

---

## Decision 8: ESLint Setup

**Decision**: Add ESLint with `@typescript-eslint` and `eslint-plugin-react-hooks` as a `devDependency`; add a `lint` script to `package.json`.

**Rationale**: Spec FR-006 requires lint to gate deployment. The current `package.json` has no `lint` script and no ESLint dependency. This must be added as part of this feature.

**Alternatives considered**: Skip lint requirement — rejected as it violates FR-006.

---

## Decision 9: Azure SWA Tier

**Decision**: Free tier for initial deployment.

**Rationale**: A Vite SPA build is well under the 250 MB/environment storage limit. 100 GB/month bandwidth is ample for a small team tool. 3 concurrent PR preview environments is sufficient for a small team. The lack of SLA is acceptable during development.

**Upgrade triggers** (documented for future reference):
- Moving to production with uptime expectations → Standard ($9/month for SLA)
- More than 3 simultaneous open PRs needing previews → Standard (10 preview envs)
- Custom auth provider needed → Standard
- Expected traffic exceeding 100 GB/month → Standard (Free has hard cutoff, not overage billing)

---

## Decision 10: Node.js Version Pinning

**Decision**: Add `"engines": { "node": ">=20.0.0" }` to `package.json`; use `actions/setup-node@v4` with `node-version: '20'` in the workflow.

**Rationale**: Oryx (Azure's build engine) has documented issues where it ignores `package.json` engines and picks an older Node version. Since we use `skip_app_build: true`, Oryx is bypassed entirely — but `actions/setup-node@v4` still provides a consistent, pinned Node environment for the manual build steps. The `engines` field documents the requirement for local development.

---

## Known Limitations and Gotchas

1. **PR preview URLs are publicly accessible** even if the GitHub repo is private. Anyone with the URL can access the staged version. Since this app handles JWK public keys and JSON schemas (neither is secret material), this is acceptable. Plaintext data filled into the form is not transmitted to Azure.

2. **PR preview environments are not geo-distributed** (production is). Preview deploys serve from a single Azure region.

3. **File count limit is 15,000 files** on both Free and Standard tiers. Vite's `dist/` output is well under this (typically ~20–50 files).

4. **The `AZURE_STATIC_WEB_APPS_API_TOKEN` must be present in both the deploy job and the close-PR job** — the close job does not inherit the deploy job's configuration.

5. **Workflow file naming**: Azure SWA links a specific workflow YAML filename to the SWA resource. Renaming the file disconnects it from the resource.
