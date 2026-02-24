<!--
  Sync Impact Report
  ==================
  Version change: (none) → 1.0.0 (initial ratification)

  Added sections:
    - Core Principles (3 principles: Client-Side Sovereignty, Static Deployment, Simplicity)
    - Technology Constraints
    - Development Workflow
    - Governance

  Modified principles: N/A (initial)
  Removed sections:    N/A (initial)

  Templates reviewed:
    ✅ .specify/templates/plan-template.md     — Constitution Check section compatible; no changes needed
    ✅ .specify/templates/spec-template.md     — Scope/requirements alignment verified; no changes needed
    ✅ .specify/templates/tasks-template.md    — Task categories compatible with current principles; no changes needed
    ✅ .specify/templates/agent-file-template.md — No outdated agent-specific references found
    ✅ .claude/commands/speckit.plan.md        — Generic; no CLAUDE-only constraints; no changes needed
    ✅ .claude/commands/speckit.specify.md     — Generic; no outdated references; no changes needed

  Deferred TODOs: None
-->

# JWE Constitution

## Core Principles

### I. Client-Side Sovereignty

All encryption and decryption operations MUST execute entirely within the browser.
No secret material — whether plaintext, ciphertext, or cryptographic key — is ever
transmitted to or processed by any server, third-party service, or external runtime.

**Rationale**: The product's trust model depends on users retaining sole custody of
their secrets. Any server-side processing would fundamentally undermine that promise
and cannot be introduced for convenience or performance reasons.

### II. Static Deployment

The deployed application MUST consist solely of static files (HTML, CSS, JS, and
assets) that can be served by any static file host, CDN, or `file://` URL without
a server-side runtime. No Node.js, Python, Go, or other runtime MAY be required
for the application to function after build.

**Rationale**: Static deployment enforces Principle I by construction, eliminates
operational attack surface, and maximises availability. Build tooling is permitted
during development but MUST NOT be a runtime dependency.

### III. Simplicity (YAGNI)

The codebase MUST contain only what is needed for the current, clearly defined
requirements. Speculative abstractions, unused configuration hooks, plugin
architectures, and "future-proof" layers are PROHIBITED until a concrete, present
need is demonstrated and documented.

Every abstraction introduced MUST be justified in the plan's Complexity Tracking
table. Three direct lines of code are preferable to a premature helper function.

**Rationale**: Security-sensitive code must be auditable. Every unnecessary
abstraction layer increases cognitive load and attack surface. Complexity MUST be
earned, not anticipated.

## Technology Constraints

- **Encryption standard**: JWE (JSON Web Encryption, RFC 7516). Implementations
  MUST use the browser-native Web Crypto API wherever it provides the required
  algorithm; third-party cryptographic libraries require explicit justification.
- **Dependencies**: Third-party dependencies MUST be minimised. Each dependency
  MUST be reviewed for security and supply-chain risk before adoption.
- **Build output**: The build step MUST produce a self-contained static bundle.
  No server-rendered HTML, SSR hydration, or backend-for-frontend is permitted.
- **Algorithm selection**: Only algorithms with current NIST or IETF approval
  MAY be used. Weak or deprecated algorithms (e.g., RSA-PKCS1v1.5, AES-CBC
  without authentication) are PROHIBITED.

## Development Workflow

- Features begin with a user story in `spec.md` before any code is written.
- Every PR MUST be verified to produce a purely static build; PRs introducing
  a server-side runtime dependency MUST NOT be merged.
- Complexity violations (anything that contradicts Principle III) MUST be
  documented in the plan's Complexity Tracking table with explicit justification
  before the PR can be merged.
- Security-sensitive changes (algorithm selection, key derivation, storage
  mechanism, CSP policy) MUST include a rationale comment referencing the
  relevant RFC, NIST publication, or OWASP guideline.

## Governance

This constitution supersedes all other project conventions. Amendments MUST:

1. Increment `CONSTITUTION_VERSION` according to the following policy:
   - **MAJOR**: Principle removal, redefinition, or backward-incompatible governance change.
   - **MINOR**: New principle or section added; material expansion of existing guidance.
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements.
2. Update `LAST_AMENDED_DATE` to the ISO date of the amendment (YYYY-MM-DD).
3. Propagate any structural changes to dependent templates in `.specify/templates/`.
4. Include a migration plan if existing features must be updated to comply.

All PRs MUST be checked against this constitution before merge. The plan's
Complexity Tracking table is the authorised record of justified exceptions.

**Version**: 1.0.0 | **Ratified**: 2026-02-23 | **Last Amended**: 2026-02-23
