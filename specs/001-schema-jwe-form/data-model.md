# Data Model: Schema-Driven JWE Form Encryptor

**Feature**: 001-schema-jwe-form
**Date**: 2026-02-23

---

## Overview

This is a stateless, client-side application. There is no persistent data store.
All entities exist as in-memory React state for the duration of a browser session.
Nothing is written to localStorage, sessionStorage, or cookies.

---

## Entities

### 1. SchemaDefinition

Represents the user-provided (or URL-parameter-supplied) JSON Schema that drives
form rendering.

```
SchemaDefinition {
  raw: string                  // Raw text as entered/received by the user
  parsed: JSONSchema7 | null   // Parsed object (null if raw is invalid JSON)
  isValid: boolean             // True if raw parses as a valid JSON Schema object
  error: string | null         // Parse/validation error message, or null
}
```

**Validation rules**:
- `raw` must be valid JSON (syntactically) → `isValid: true`
- Top-level parsed object must have a `"properties"` key (at minimum)
- Empty `properties` is allowed but triggers an informational UI message
- Malformed JSON sets `isValid: false` and populates `error`

**State transitions**:
```
empty → user types → validating → valid (form renders) | invalid (error shown)
URL param provided → auto-parsed on load → valid | invalid (error banner)
```

---

### 2. UISchema (derived)

Not stored as user input — computed from `SchemaDefinition.parsed` by `schemaUtils.ts`.

```
UISchema {
  [fieldName: string]: {
    "ui:widget"?: "password" | string
    "ui:title"?:  string
    // ... other RJSF uiSchema keys as needed
  }
}
```

**Derivation rule**: For each property in `SchemaDefinition.parsed.properties` where
`x-sensitive === true`, emit `{ "ui:widget": "password" }` for that field key.

---

### 3. FormData

The collection of user-entered values, keyed by field name as defined in the schema.

```
FormData {
  [fieldName: string]: string | number | boolean | null
}
```

**Validation rules** (enforced by RJSF before encryption is allowed):
- All fields listed in `SchemaDefinition.parsed.required[]` must have a non-empty value
- Field types must match the schema `"type"` declaration
- RJSF handles all validation and surfaces error messages per field

**State transitions**:
```
empty → user types → RJSF live-validates → valid (Encrypt enabled) | invalid (errors shown)
Schema change → FormData reset (with user confirmation)
```

---

### 4. PublicKey

The recipient's asymmetric public key used to encrypt the form data.

```
PublicKey {
  raw: string               // Raw text as pasted by the user, or from URL param
  parsed: JsonWebKey | null // Parsed JWK object (null if invalid)
  cryptoKey: CryptoKey | null // Imported browser CryptoKey (null until imported)
  isValid: boolean          // True if parsed and successfully imported
  error: string | null      // Import error message, or null
}
```

**Validation rules**:
- `raw` must be valid JSON
- Parsed object must be a JWK with `"kty"` present
- Key type must be compatible with RSA-OAEP-256 (typically `"kty": "RSA"`)
- `importJWK(parsed, "RSA-OAEP-256")` must succeed without error
- EC keys are not supported in this iteration (out of scope)

**State transitions**:
```
empty → user pastes → validate JSON → importJWK → valid | error message shown
URL param provided → auto-parsed on load → importJWK → valid | error banner
```

---

### 5. EncryptedPayload

The output of a successful encryption operation.

```
EncryptedPayload {
  value: string | null      // JWE compact serialization string, or null
  isCopied: boolean         // True for ~2s after copy action (drives UI feedback)
  encryptedAt: Date | null  // Timestamp of last successful encryption
}
```

**Format**: JWE Compact Serialization — five base64url-encoded segments separated by dots:
```
BASE64URL(JWE Protected Header)
  . BASE64URL(JWE Encrypted Key)
  . BASE64URL(JWE Initialization Vector)
  . BASE64URL(JWE Ciphertext)
  . BASE64URL(JWE Authentication Tag)
```

**Protected Header** (fixed for this implementation):
```json
{ "alg": "RSA-OAEP-256", "enc": "A256GCM" }
```

**State transitions**:
```
null → Encrypt clicked (all inputs valid) → encrypting → success (value set) | error (null, notification shown)
Schema or FormData change after encryption → value cleared (stale output)
```

---

## App-Level State Summary

```
AppState {
  schema:   SchemaDefinition
  uiSchema: UISchema           // derived from schema
  formData: FormData
  publicKey: PublicKey
  output:   EncryptedPayload
}
```

---

## URL Parameter Mapping

| URL Parameter | Maps to              | Processing                                   |
|---------------|----------------------|----------------------------------------------|
| `?schema=`    | `AppState.schema.raw`| URL-decoded on load; triggers schema parsing |
| `?key=`       | `AppState.publicKey.raw` | URL-decoded on load; triggers key import |

Both parameters are read-only on load. Subsequent user edits update state normally.
