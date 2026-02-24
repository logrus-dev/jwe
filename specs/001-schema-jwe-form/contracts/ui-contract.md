# UI Contract: Schema-Driven JWE Form Encryptor

**Feature**: 001-schema-jwe-form
**Date**: 2026-02-23

This document defines the user-facing interface contracts — the observable behaviors
and UI states that the application must satisfy, independent of implementation details.

---

## Page Layout Contract

The application renders as a single page with a centered, responsive layout.
Maximum content width: `860px`. Page has a persistent header and a single scrollable
content area. Dark mode toggle is available in the header.

```
┌──────────────────────────────────────────────────────────┐
│  HEADER: App title + dark mode toggle                    │
├──────────────────────────────────────────────────────────┤
│  STEP 1 CARD: Schema Input                               │
│    [ Schema textarea ]  ← monospace, auto-resize         │
│    [ Parse & Render Form button ]                        │
│    [ Error alert if schema invalid ]                     │
├──────────────────────────────────────────────────────────┤
│  STEP 2 CARD: Dynamic Form  ← hidden until schema valid  │
│    [ RJSF-rendered fields ]                              │
│    [ Sensitive fields rendered as PasswordInput ]        │
│    [ Per-field validation errors ]                       │
├──────────────────────────────────────────────────────────┤
│  STEP 3 CARD: Public Key                                 │
│    [ Key textarea ] ← monospace                          │
│    [ Valid key indicator / error indicator ]             │
├──────────────────────────────────────────────────────────┤
│  STEP 4 CARD: Encrypt                                    │
│    [ Encrypt button ] ← disabled until form + key valid  │
│    [ Encrypted payload output area ]  ← code display    │
│    [ Copy button ]                                       │
└──────────────────────────────────────────────────────────┘
```

---

## Component State Contracts

### SchemaInput Component

| State            | UI Representation                                      |
|------------------|--------------------------------------------------------|
| Empty            | Placeholder text shown in textarea                    |
| Typing           | Raw text shown; no validation yet                     |
| Invalid JSON     | Red error alert below textarea: "Invalid JSON: ..."   |
| Valid, no props  | Yellow warning: "Schema has no properties defined"   |
| Valid            | Green badge: "Schema valid"; "Render Form" btn active |

**Pre-fill contract**: If `?schema=` URL parameter present on load, textarea is
pre-populated and form is immediately rendered (no button click required).

---

### DynamicForm Component

| State               | UI Representation                                  |
|---------------------|----------------------------------------------------|
| Schema not yet set  | Section hidden (not rendered)                      |
| Schema valid        | RJSF form rendered with all schema properties      |
| Field required+empty| Red error text below the field                     |
| Sensitive field     | PasswordInput — characters masked, toggle eye icon |
| Non-sensitive field | Standard TextInput                                 |
| All fields valid    | No error indicators visible                        |

**Field label contract**: Uses schema property `"title"` if present, otherwise
uses the property key name with first letter capitalized.

**Schema change contract**: If user edits the schema after filling in the form:
- A confirmation modal appears: "Changing the schema will clear all entered data.
  Continue?"
- On confirm: form data is cleared, new form is rendered
- On cancel: schema textarea reverts to previous value

---

### PublicKeyInput Component

| State           | UI Representation                                         |
|-----------------|-----------------------------------------------------------|
| Empty           | Placeholder: "Paste JWK public key (JSON format)..."     |
| Typing          | No live validation (validate on blur/paste)               |
| Invalid JSON    | Error badge: "Invalid JSON"                               |
| Valid JSON, bad key | Error badge: "Not a valid RSA public key"             |
| Valid JWK key   | Success badge: "Key ready" (green)                        |

**Pre-fill contract**: If `?key=` URL parameter present on load, textarea is
pre-populated and key is imported automatically.

---

### EncryptButton Component

| State                          | UI Representation                           |
|--------------------------------|---------------------------------------------|
| Schema invalid or absent       | Button disabled, tooltip: "Fix schema first"|
| Form has validation errors     | Button disabled, tooltip: "Fix form errors" |
| Key invalid or absent          | Button disabled, tooltip: "Provide valid key"|
| All inputs valid               | Button enabled, primary color               |
| Encrypting (in progress)       | Button shows loading spinner                |
| Encryption failed              | Error notification (toast): reason shown    |

---

### EncryptedOutput Component

| State              | UI Representation                                       |
|--------------------|---------------------------------------------------------|
| No output yet      | Output area shows placeholder text                     |
| Output available   | Scrollable code block with JWE compact string           |
| Copy idle          | "Copy" button with clipboard icon                      |
| Copy success       | Button briefly changes to "Copied!" with check icon    |
| No clipboard API   | Button triggers text selection for manual copy          |

---

## URL Parameter Contract

| Parameter | Format            | Behavior on Invalid Value              |
|-----------|-------------------|----------------------------------------|
| `schema`  | URL-encoded JSON  | Red banner at top of page; schema textarea left empty |
| `key`     | URL-encoded JSON  | Red banner at top of page; key textarea left empty    |

Both banners are dismissible and do not prevent the user from manually entering values.

---

## Error Notification Contract

All error notifications use Mantine's notification system (toast, top-right):

| Trigger                      | Message                                              |
|------------------------------|------------------------------------------------------|
| Encryption failure           | "Encryption failed: [reason from jose error]"       |
| Key incompatible with alg    | "Key is not compatible with RSA-OAEP-256"           |
| Clipboard write denied       | "Could not copy automatically — text is selected"   |
| URL param schema invalid     | "URL schema parameter is invalid: [detail]" (banner)|
| URL param key invalid        | "URL key parameter is invalid: [detail]" (banner)   |

---

## Accessibility Contract

- All interactive elements have visible focus indicators
- Form fields have associated `<label>` elements (provided by RJSF/Mantine)
- Error messages are associated with their fields via `aria-describedby`
- Color is never the sole indicator of state (icons/text accompany color badges)
- Dark mode uses system preference as default; manual toggle persists for the session

---

## Output Format Contract

The encrypted payload displayed in the output area MUST conform to JWE Compact
Serialization (RFC 7516 §3.1):

```
<header>.<encryptedKey>.<iv>.<ciphertext>.<tag>
```

Where each segment is base64url-encoded (no padding). This format is the only
output format produced by this application.
