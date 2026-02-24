# Implementation Plan: Azure Static Web App Deployment

**Branch**: `001-azure-static-deploy` | **Date**: 2026-02-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-azure-static-deploy/spec.md`

## Summary

Deploy the JWE form SPA to Azure Static Web Apps via a GitHub Actions CI/CD pipeline. The pipeline runs typecheck and lint before building, blocks deployment on failures, and automatically creates PR preview environments. A `staticwebapp.config.json` configuration file provides SPA routing fallback, correct MIME types for Vite-emitted assets, differentiated cache-control headers, and security headers. ESLint is added to the project to satisfy the lint gate requirement.

## Technical Context

**Language/Version**: TypeScript 5.x
**Primary Dependencies**: GitHub Actions (`actions/setup-node@v4` v4, `Azure/static-web-apps-deploy@v1`), Vite 6.x (existing build tool), ESLint + `@typescript-eslint` (new, for lint gate)
**Storage**: N/A — static files on Azure CDN
**Testing**: `npm run typecheck` (tsc --noEmit, existing), `npm run lint` (ESLint, new)
**Target Platform**: Azure Static Web Apps (Free tier), GitHub Actions (ubuntu-latest runners)
**Project Type**: Single-page application deployment pipeline
**Performance Goals**: Deployment completes within 5 minutes of pipeline completion; static assets served globally via built-in CDN
**Constraints**: Build artifact ≤ 250 MB (Free tier storage limit); 100 GB/month bandwidth limit; no server-side runtime in build output (Constitution Principle II)
**Scale/Scope**: Small team (1–3 developers); up to 3 concurrent PR preview environments (Free tier)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Client-Side Sovereignty** | ✅ PASS | Deployment infrastructure does not affect where encryption runs. All JWE operations remain in-browser. No server-side processing introduced. |
| **II. Static Deployment** | ✅ PASS | Azure Static Web Apps is a pure static file host; no server-side runtime. This feature directly fulfills Principle II by establishing a static hosting environment. |
| **III. Simplicity (YAGNI)** | ✅ PASS | One workflow YAML file, one `staticwebapp.config.json`, one `.eslintrc.cjs`. No new abstractions, plugin systems, or speculative infrastructure. Each file has a single clearly-defined purpose required by the spec. |
| **Technology Constraints** | ✅ PASS | No new application-level dependencies (ESLint is dev-only, not in the built artifact). No new cryptographic code. No third-party services for encryption. |

**Post-Design Re-check** (after Phase 1):

| Principle | Status | Notes |
|-----------|--------|-------|
| **I. Client-Side Sovereignty** | ✅ PASS | `staticwebapp.config.json` CSP policy uses `connect-src 'self'` — no external API connections permitted. |
| **II. Static Deployment** | ✅ PASS | `skip_app_build: true` + `api_location: ""` confirms no server runtime introduced. Workflow uploads pre-built static files only. |
| **III. Simplicity (YAGNI)** | ✅ PASS | Design reviewed. No complexity violations. Each added file is strictly required by a spec requirement. |

**Complexity Tracking**: No violations. Table omitted.

## Project Structure

### Documentation (this feature)

```text
specs/001-azure-static-deploy/
├── plan.md              # This file
├── research.md          # Phase 0 — decisions and rationale
├── data-model.md        # Phase 1 — configuration artifact model
├── quickstart.md        # Phase 1 — Azure resource setup guide
├── checklists/
│   └── requirements.md  # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks — not yet created)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    └── azure-static-web-apps.yml   # CI/CD pipeline (NEW)

public/
└── staticwebapp.config.json         # SPA routing + MIME + cache + security headers (NEW)

package.json                         # Add: engines.node, scripts.lint (MODIFIED)
.eslintrc.cjs                        # ESLint configuration (NEW)
```

**Structure Decision**: Single-project layout (existing). All new files are configuration/infrastructure — no changes to `src/` or `src/utils/`. The build output (`dist/`) is unchanged by this feature; it is merely deployed to a new target.

## Decisions Summary

See `research.md` for full rationale. Key decisions:

1. **Build strategy**: Pre-build in workflow (`npm ci` → typecheck → lint → `npm run build`) then `skip_app_build: true` in the deploy action. Bypasses Oryx to avoid Node version mismatch and enables pre-deploy gates.

2. **SPA routing**: `navigationFallback` in `staticwebapp.config.json` (not catch-all `routes`). Checked after filesystem — real asset files are served directly, only unresolvable paths fall back to `index.html`. Preserves `?schema=...&key=...` query strings on direct navigation.

3. **Config file placement**: `public/staticwebapp.config.json` — Vite copies `public/` contents to `dist/` root on build; no extra CI steps needed.

4. **Caching**: `no-store` on `index.html`; `immutable, max-age=31536000` on hashed `/assets/*`; 24-hour cache on unhashed static assets.

5. **ESLint**: Added as dev dependency to satisfy FR-006 (lint gate). Minimal config: TypeScript + React Hooks rules.

6. **Tier**: Free (250 MB storage/env, 3 PR previews, 100 GB bandwidth). Upgrade triggers documented in `research.md`.
