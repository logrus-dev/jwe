# Quickstart: Schema-Driven JWE Form Encryptor

**Feature**: 001-schema-jwe-form
**Date**: 2026-02-23

This guide validates the implementation end-to-end. Run through each scenario after
completing the build.

---

## Prerequisites

```bash
node -v     # 20.x or later
npm -v      # 10.x or later
```

---

## 1. Install and Build

```bash
# From repo root
npm install
npm run build        # Vite static build → dist/
npm run preview      # Serve dist/ locally at http://localhost:4173
```

Expected: Browser opens to the app. No console errors.

---

## 2. Validate: Core Encrypt Flow (User Story 1)

Open `http://localhost:4173` with no query parameters.

### Step 2a — Enter an invalid schema

Paste the following into the schema textarea:

```
this is not json
```

**Expected**: Red error alert appears below the textarea ("Invalid JSON").
The form section below is not rendered.

### Step 2b — Enter a valid schema with a sensitive field

Clear the textarea and paste:

```json
{
  "title": "Employee Record",
  "type": "object",
  "properties": {
    "name": {
      "type": "string",
      "title": "Full Name"
    },
    "department": {
      "type": "string",
      "title": "Department"
    },
    "salary": {
      "type": "number",
      "title": "Annual Salary",
      "x-sensitive": true
    },
    "ssn": {
      "type": "string",
      "title": "Social Security Number",
      "x-sensitive": true
    }
  },
  "required": ["name", "ssn"]
}
```

Click "Render Form" (or press the parse button).

**Expected**:
- A form appears with 4 fields: "Full Name", "Department", "Annual Salary", "Social Security Number"
- "Annual Salary" and "Social Security Number" are rendered as password inputs (characters masked)
- "Full Name" and "Department" are plain text inputs

### Step 2c — Attempt encryption without filling required fields

Leave "Full Name" empty, paste a valid JWK key (see Step 2d), and click "Encrypt".

**Expected**: "Full Name" and "Social Security Number" fields show red validation errors.
The encryption does not proceed.

### Step 2d — Generate a test JWK public key

Run in a terminal (or use an online JWK generator):

```bash
node -e "
const { webcrypto } = require('crypto');
webcrypto.subtle.generateKey(
  { name: 'RSA-OAEP', modulusLength: 2048, publicExponent: new Uint8Array([1,0,1]), hash: 'SHA-256' },
  true,
  ['encrypt', 'decrypt']
).then(async kp => {
  const pub = await webcrypto.subtle.exportKey('jwk', kp.publicKey);
  console.log(JSON.stringify(pub, null, 2));
});
"
```

Copy the printed JWK public key JSON.

### Step 2e — Fill the form and encrypt

1. Enter "Alice Smith" in Full Name
2. Enter "Engineering" in Department
3. Enter `95000` in Annual Salary (masked while typing)
4. Enter `123-45-6789` in SSN (masked while typing)
5. Paste the JWK public key from Step 2d into the Key textarea
   - **Expected**: Green "Key ready" badge appears
6. Click "Encrypt"
   - **Expected**: Loading spinner briefly shown, then encrypted JWE string appears
     in the output area (format: 5 base64url segments separated by dots)
7. Click "Copy"
   - **Expected**: Button briefly shows "Copied!" with check icon

### Step 2f — Verify the output is valid JWE

```bash
node -e "
// Paste your generated JWE string and private key JWK here
const { compactDecrypt } = require('jose');
// ... (See verification snippet in the Decrypt section below)
"
```

---

## 3. Validate: URL Parameter Pre-configuration (User Story 2)

### Step 3a — Construct a pre-configured URL

Take the schema from Step 2b and the JWK key from Step 2d, URL-encode both:

```bash
node -e "
const schema = JSON.stringify({/* paste schema here */});
const key = JSON.stringify({/* paste public JWK here */});
console.log('?schema=' + encodeURIComponent(schema) + '&key=' + encodeURIComponent(key));
"
```

Append the output to `http://localhost:4173`.

### Step 3b — Open the pre-configured URL

**Expected**:
- Page loads with the form already rendered (no button click needed)
- Key textarea is pre-filled and shows "Key ready" badge
- User only needs to fill in the form fields and click Encrypt

### Step 3c — Invalid schema URL parameter

Navigate to: `http://localhost:4173?schema=INVALID_JSON`

**Expected**: Red banner at top: "URL schema parameter is invalid". Schema textarea is
empty. The rest of the page is functional.

### Step 3d — Invalid key URL parameter

Navigate to: `http://localhost:4173?key=INVALID_JSON`

**Expected**: Red banner: "URL key parameter is invalid". Key textarea is empty.

---

## 4. Validate: Encrypted Payload Decryptability

Use the private key corresponding to the public key from Step 2d to verify the payload:

```bash
node -e "
const { compactDecrypt, importJWK } = require('jose');

const privateJwk = /* paste private JWK here */;
const jwe = \`/* paste JWE compact string here */\`;

(async () => {
  const key = await importJWK(privateJwk, 'RSA-OAEP-256');
  const { plaintext } = await compactDecrypt(jwe, key);
  console.log(new TextDecoder().decode(plaintext));
})();
"
```

**Expected**: Decrypted JSON matches the values entered in the form:
```json
{
  "name": "Alice Smith",
  "department": "Engineering",
  "salary": 95000,
  "ssn": "123-45-6789"
}
```

---

## 5. Validate: Static Build Integrity

```bash
# Verify no server-side code in the build output
ls dist/
# Expected: index.html, assets/ directory only

# Verify no network requests with user data
# 1. Open dist/index.html in browser (file:// URL or via `npm run preview`)
# 2. Open DevTools → Network tab
# 3. Complete a full encryption flow
# Expected: Zero network requests (the tab should remain empty except
#           for the initial page load of static assets)
```

---

## 6. Validate: Dark Mode

Click the dark mode toggle in the header.

**Expected**: All components (textarea, form fields, cards, buttons, output area)
switch to dark theme. Toggle again to return to light mode.

---

## 7. Schema Change Confirmation

1. Complete steps 2b-2e (fill the form)
2. Edit the schema textarea (change any field name)
3. Click "Render Form"

**Expected**: Confirmation modal: "Changing the schema will clear all entered data.
Continue?" — clicking Cancel preserves current form data.
