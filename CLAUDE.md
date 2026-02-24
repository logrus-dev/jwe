# JWE Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-23

## Active Technologies
- TypeScript 5.x + GitHub Actions (`actions/setup-node@v4` v4, `Azure/static-web-apps-deploy@v1`), Vite 6.x (existing build tool), ESLint + `@typescript-eslint` (new, for lint gate) (001-azure-static-deploy)
- N/A — static files on Azure CDN (001-azure-static-deploy)
- TypeScript 5.x + React 18.x (useState, useEffect — already in use) (001-url-param-hide-steps)

- **Language**: TypeScript 5.x
- **Runtime/Framework**: React 18.x (client-side SPA)
- **Build tool**: Vite 6.x (`@vitejs/plugin-react`)
- **Form rendering**: `@rjsf/core` v5 + `@rjsf/mantine` (JSON Schema → Mantine-themed form)
- **Encryption**: `jose` v6 (JWE compact serialization, RSA-OAEP-256 + A256GCM)
- **UI components**: Mantine v7 (`@mantine/core`, `@mantine/hooks`, `@mantine/notifications`, `@mantine/code-highlight`)

## Project Structure

```text
index.html
vite.config.ts
tsconfig.json
package.json

src/
├── main.tsx                  # React root, MantineProvider, theme setup
├── App.tsx                   # Top-level layout: header + step cards
├── components/
│   ├── SchemaInput.tsx       # Step 1: JSON Schema textarea + parse + error
│   ├── DynamicForm.tsx       # Step 2: RJSF form with @rjsf/mantine theme
│   ├── PublicKeyInput.tsx    # Step 3: JWK key textarea + validation badge
│   └── EncryptedOutput.tsx   # Step 4: Encrypt button + JWE output + CopyButton
└── utils/
    ├── schemaUtils.ts        # Schema validation + x-sensitive → uiSchema
    ├── encrypt.ts            # jose CompactEncrypt wrapper
    └── urlParams.ts          # ?schema= and ?key= URL param parsing

dist/                         # Vite build output (gitignored)
specs/                        # Feature specs (speckit)
```

## Commands

```bash
npm install           # Install dependencies
npm run dev           # Dev server (http://localhost:5173)
npm run build         # Static build → dist/
npm run preview       # Serve dist/ locally (http://localhost:4173)
npm run typecheck     # tsc --noEmit
npm run lint          # ESLint
```

## Code Style

- TypeScript strict mode enabled
- Functional React components with hooks only (no class components)
- Props typed inline or with separate `interface` in same file
- Utility functions are pure (no side effects) and tested with Vitest
- Imports: external libs first, then internal utils, then local components
- No `any` types — use `unknown` + type guards where needed

## Recent Changes
- 001-url-param-hide-steps: Added TypeScript 5.x + React 18.x (useState, useEffect — already in use)
- 001-azure-static-deploy: Added TypeScript 5.x + GitHub Actions (`actions/setup-node@v4` v4, `Azure/static-web-apps-deploy@v1`), Vite 6.x (existing build tool), ESLint + `@typescript-eslint` (new, for lint gate)

- **001-schema-jwe-form** (2026-02-23): Initial feature — schema-driven JWE form
  encryptor. Full tech stack established: React + Vite + RJSF + jose + Mantine.

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
