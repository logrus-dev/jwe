# Quickstart: Azure Static Web App Deployment Setup

**Feature**: `001-azure-static-deploy`
**Date**: 2026-02-23
**Audience**: Developer setting up the Azure SWA resource and CI/CD for the first time.

---

## Prerequisites

- An Azure account with an active subscription
- Owner or Contributor role on the Azure subscription (to create resources)
- The GitHub repository with write access (to add secrets)
- Azure CLI installed locally (`az`), or access to the Azure portal

---

## Step 1: Create the Azure Static Web App Resource

### Via Azure Portal

1. Sign in to [portal.azure.com](https://portal.azure.com)
2. Click **Create a resource** → search for **Static Web App** → click **Create**
3. Fill in:
   - **Subscription**: Your Azure subscription
   - **Resource group**: Create new or use existing (e.g., `rg-jwe-encryptor`)
   - **Name**: e.g., `jwe-encryptor` (must be globally unique)
   - **Plan type**: **Free**
   - **Region**: Choose the region closest to your primary users
   - **Deployment source**: Select **Other** (we manage the GitHub Actions workflow manually)
4. Click **Review + create** → **Create**
5. Wait for the resource to deploy (~30 seconds)

### Via Azure CLI

```bash
# Log in
az login

# Create resource group (skip if reusing existing)
az group create --name rg-jwe-encryptor --location eastus

# Create the Static Web App (Free tier, manual deployment source)
az staticwebapp create \
  --name jwe-encryptor \
  --resource-group rg-jwe-encryptor \
  --location eastus \
  --sku Free \
  --source None
```

---

## Step 2: Retrieve the Deployment Token

### Via Azure Portal

1. In the Azure portal, navigate to your new Static Web App resource
2. In the left menu, click **Manage deployment token** (or find it under **Overview** → **Manage deployment token**)
3. Copy the token value — it is a long alphanumeric string

### Via Azure CLI

```bash
az staticwebapp secrets list \
  --name jwe-encryptor \
  --resource-group rg-jwe-encryptor \
  --query "properties.apiKey" \
  --output tsv
```

---

## Step 3: Add the Deployment Token to GitHub Secrets

1. Navigate to your GitHub repository
2. Go to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `AZURE_STATIC_WEB_APPS_API_TOKEN`
5. Value: Paste the deployment token from Step 2
6. Click **Add secret**

> **Security note**: This token grants write access to your Azure Static Web App deployment. Treat it like a password. GitHub Actions encrypts it at rest and never exposes it in logs.

---

## Step 4: Verify the Workflow File

Ensure the file `.github/workflows/azure-static-web-apps.yml` exists in the repository root. It should already be present after implementing this feature. If not, see `research.md` for the full workflow YAML.

---

## Step 5: Trigger the First Deployment

Push any commit to the `main` branch:

```bash
git push origin main
```

Navigate to the **Actions** tab in your GitHub repository. The `Azure Static Web Apps CI/CD` workflow should appear and run through these stages:

1. **Checkout** — clones the repo
2. **Set up Node.js** — pins Node 20
3. **Install dependencies** — `npm ci`
4. **Type check** — `npm run typecheck` (fails here → no deployment)
5. **Lint** — `npm run lint` (fails here → no deployment)
6. **Build** — `npm run build` → produces `dist/`
7. **Deploy** — uploads `dist/` to Azure SWA

---

## Step 6: Find Your Production URL

Once the first deployment succeeds:

1. In the Azure portal, navigate to your Static Web App resource
2. The **URL** field on the Overview page shows your production URL (e.g., `https://blue-wave-012345678.azurestaticapps.net`)
3. Visit the URL to verify the JWE form application loads correctly

---

## Step 7: Test PR Preview Environments

1. Create a new branch and make any change:
   ```bash
   git checkout -b test/preview-env
   # make a trivial change
   git add . && git commit -m "test: verify PR preview environment"
   git push origin test/preview-env
   ```
2. Open a pull request against `main`
3. Wait for the GitHub Actions workflow to complete
4. The GitHub Actions bot will post a comment on the PR with a preview URL like:
   `https://blue-wave-012345678-pr-1.eastus.azurestaticapps.net`
5. Visit the URL to verify the preview environment works
6. Close or merge the PR — the preview environment is automatically deleted

---

## Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| Blank page / JS MIME type error | `navigationFallback` misconfiguration | Verify `public/staticwebapp.config.json` exists and has correct `exclude` list and `mimeTypes` |
| 404 on hard refresh | SPA fallback not working | Same as above |
| Workflow secret error | `AZURE_STATIC_WEB_APPS_API_TOKEN` not set | Add secret in GitHub Settings → Secrets |
| Build fails with type errors | TypeScript errors in source | Fix the TS errors; deployment gate is working correctly |
| Build fails with lint errors | ESLint violations | Fix lint issues; deployment gate is working correctly |
| Close PR job fails: "deployment_token was not provided" | Token missing from `close_pull_request` job | Ensure `azure_static_web_apps_api_token` is set in both jobs |
| App works locally but not on Azure | Node version mismatch during Oryx build | Ensure `skip_app_build: true` is set in the workflow |

---

## Ongoing Operations

- **Deployment**: Push to `main` — fully automated.
- **PR previews**: Open a PR — automatically created. Close/merge — automatically cleaned up.
- **Token rotation**: If the deployment token is compromised, regenerate it in the Azure portal and update the GitHub secret.
- **Tier upgrade**: If you need SLA, more than 3 preview environments, or overage bandwidth billing, upgrade to Standard ($9/month) in the Azure portal under **Hosting plan**.
