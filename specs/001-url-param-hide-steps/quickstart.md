# Quickstart: URL Parameter Auto-Hide Steps

**Feature**: `001-url-param-hide-steps`
**Date**: 2026-02-24

## Purpose

Manual verification guide for the three hiding scenarios described in the spec.
All tests are performed in a running dev server or production build.

## Prerequisites

```bash
npm run dev    # Dev server at http://localhost:5173
# or
npm run build && npm run preview   # Production build at http://localhost:4173
```

Have a valid JSON Schema and a valid JWK public key ready, or use the examples below.

---

## Example Test Values

### Minimal JSON Schema (URL-encoded)

```
%7B%22type%22%3A%22object%22%2C%22properties%22%3A%7B%22name%22%3A%7B%22type%22%3A%22string%22%2C%22title%22%3A%22Name%22%7D%7D%7D
```
(Decodes to: `{"type":"object","properties":{"name":{"type":"string","title":"Name"}}}`)

### Empty-param edge case (should NOT hide section)

```
?schema=
```

---

## Scenario 1: Both Parameters — Focused Encrypt Mode

**URL**: `http://localhost:5173/?schema=<encoded-schema>&key=<encoded-key>`

**Expected result**:
- Step 1 card (Define Schema) is **not present** in the DOM
- Step 3 card (Provide Encryption Key) is **not present** in the DOM
- Step 2 card (Fill the Form) is visible (once schema is valid)
- Step 4 card (Encrypt & Copy) is visible
- No flash of Step 1 or Step 3 before they disappear

**Verify in DevTools**: Elements panel → confirm no `<div>` or `<section>` for
Step 1 or Step 3 exists anywhere in the document.

---

## Scenario 2: Schema Parameter Only

**URL**: `http://localhost:5173/?schema=<encoded-schema>`

**Expected result**:
- Step 1 card is **not present** in the DOM
- Step 3 card (key input) **is visible**
- Form renders from the URL-provided schema
- User can type a key and encrypt normally

---

## Scenario 3: Key Parameter Only

**URL**: `http://localhost:5173/?key=<encoded-key>`

**Expected result**:
- Step 3 card is **not present** in the DOM
- Step 1 card (schema input) **is visible**
- User can type a schema, render the form, and encrypt using the URL-provided key

---

## Edge Case: Empty Parameter Value

**URL**: `http://localhost:5173/?schema=`

**Expected result**:
- Step 1 card **is visible** (empty value treated as absent)
- No error banner shown

---

## Edge Case: Invalid Schema in URL

**URL**: `http://localhost:5173/?schema=not-valid-json`

**Expected result**:
- Step 1 card is **not present** in the DOM (schema param is non-empty → section hidden)
- A red error banner appears: "URL schema parameter is invalid"
- Step 2 (form) does not render
- Step 3 and Step 4 are visible

---

## Edge Case: Invalid Key in URL

**URL**: `http://localhost:5173/?key=not-a-valid-jwk`

**Expected result**:
- Step 3 card is **not present** in the DOM (key param is non-empty → section hidden)
- A red error banner appears: "URL key parameter is invalid"
- Encryption cannot proceed until a schema and form data are provided, but no key
  input is shown

---

## Edge Case: Browser Back/Forward Navigation

1. Open the app without params (full view)
2. Navigate to a URL with `?schema=<encoded>` (schema hidden)
3. Use browser Back button → full view restored (Step 1 visible)
4. Use browser Forward button → schema hidden again

**Expected result**: Visible sections always match the current URL's parameters.
