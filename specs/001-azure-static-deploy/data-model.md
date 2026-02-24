# Data Model: Azure Static Web App Deployment

**Feature**: `001-azure-static-deploy`
**Date**: 2026-02-23

---

This feature introduces no application-level data model changes. It adds configuration artifacts that define how the application is built, deployed, and served. Those artifacts are documented here as the "model" for this feature.

---

## Configuration Artifacts

### 1. Deployment Workflow

**File**: `.github/workflows/azure-static-web-apps.yml`
**Purpose**: Defines the CI/CD pipeline that builds and deploys the application.

| Field | Value | Notes |
|-------|-------|-------|
| Trigger (push) | `main` branch | Deploys to production |
| Trigger (PR) | opened, synchronize, reopened, closed against `main` | Deploys/tears down preview env |
| Build gate: typecheck | `npm run typecheck` | Blocks deploy on TS errors |
| Build gate: lint | `npm run lint` | Blocks deploy on lint errors |
| Build command | `npm run build` | Produces `dist/` |
| App location | `/` | Repo root (where `package.json` lives) |
| API location | `""` | Empty — no backend API |
| Output location | `dist` | Vite's build output directory |
| Skip app build | `true` | Oryx build bypassed; pre-built dist/ used |
| Node version | `20` | Pinned via `actions/setup-node@v4` |
| Required secret | `AZURE_STATIC_WEB_APPS_API_TOKEN` | Set in GitHub repo Settings > Secrets |
| PR comment token | `secrets.GITHUB_TOKEN` | Auto-provided; posts preview URL on PR |

**State transitions**:

```
push to main          → build_and_deploy job  → production URL live
PR opened/updated     → build_and_deploy job  → preview URL posted on PR
PR closed/merged      → close_pull_request job → preview environment deleted
build step fails      → workflow fails         → existing deployment unchanged
```

---

### 2. SWA Routing & Headers Configuration

**File**: `public/staticwebapp.config.json`
**Purpose**: Controls URL routing, caching, MIME types, and security headers for the deployed application.
**Placement**: `public/` — Vite copies it to `dist/staticwebapp.config.json` on build.

#### Routing Model

| Request path | Behavior | Mechanism |
|---|---|---|
| `/assets/*.js`, `/assets/*.css`, etc. | Served directly from CDN | Real file exists; `navigationFallback` not triggered |
| `/` (root) | Serves `index.html` | Real file exists |
| `/?schema=...&key=...` | Serves `index.html`; query string preserved in browser URL | `navigationFallback` with 200 response |
| Any non-asset path on hard refresh | Serves `index.html` with 200 | `navigationFallback` |
| Any path matching `exclude` patterns | Served as-is; returns 404 if not found | Excluded from fallback |

#### Cache-Control Model

| Route pattern | Cache-Control | Rationale |
|---|---|---|
| `/index.html` | `no-store` | Entry point — must always fetch fresh; contains references to hashed bundles |
| `/assets/*.js`, `/assets/*.mjs`, `/assets/*.css` | `public, max-age=31536000, immutable` | Content-hashed filenames — safe to cache indefinitely |
| `/assets/*` (catch-all) | `public, max-age=31536000, immutable` | Other hashed asset types |
| `/*.svg`, `/*.ico` | `public, max-age=86400` | Unhashed static assets — 24-hour cache |
| `/*.webmanifest` | `no-cache` | Must revalidate; app metadata |

#### Security Headers Model

| Header | Value | Purpose |
|---|---|---|
| `Content-Security-Policy` | `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'` | Restricts content sources; `unsafe-inline` required for Mantine/Emotion CSS-in-JS |
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains` | Forces HTTPS on all future visits (platform already enforces HTTPS) |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing |
| `X-Frame-Options` | `DENY` | Prevents clickjacking (complements CSP `frame-ancestors`) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Limits referrer header exposure |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), bluetooth=()` | Disables unused browser APIs |

---

### 3. Package.json Additions

**File**: `package.json` (modified)
**Purpose**: Adds ESLint support and Node version declaration.

| Addition | Value | Purpose |
|---|---|---|
| `scripts.lint` | `eslint src --ext .ts,.tsx` | Enables `npm run lint` for CI gate |
| `engines.node` | `>=20.0.0` | Documents minimum Node requirement |
| `devDependencies` | `eslint`, `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`, `eslint-plugin-react-hooks` | ESLint with TypeScript and React Hooks rules |

**New config file**: `.eslintrc.cjs` — ESLint configuration with TypeScript and React Hooks rules.

---

## Azure Resource Model

The following Azure resource must exist before deployment can succeed. It is provisioned manually (out of scope for this feature's automation).

| Property | Value |
|---|---|
| Resource type | Azure Static Web Apps |
| Tier | Free (development) |
| Region | Any (static content is geo-distributed globally post-deploy) |
| Deployment token | Retrieved from Azure portal; stored as `AZURE_STATIC_WEB_APPS_API_TOKEN` in GitHub Secrets |
| Production URL | `https://<auto-generated-subdomain>.azurestaticapps.net` |
| PR preview URL pattern | `https://<subdomain>-<pr-number>.<region>.azurestaticapps.net` |
| Preview environments | Up to 3 concurrent (Free tier) |
| Storage per environment | 250 MB (Free tier) |
