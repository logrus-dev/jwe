# Feature Specification: Schema-Driven JWE Form Encryptor

**Feature Branch**: `001-schema-jwe-form`
**Created**: 2026-02-23
**Status**: Draft
**Input**: User description: "Build a client-only static web site which renders a form based on a
declarative schema, takes the data entered to the form as json and encrypt it using JWE standard."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Core Encrypt Flow (Priority: P1)

A user who needs to securely transmit structured data to a specific recipient opens the app,
provides a schema describing what information to collect, fills in the form fields (with sensitive
fields automatically hidden from view), enters the recipient's public encryption key, and receives
an encrypted payload they can safely copy and send through any channel.

**Why this priority**: This is the entire value proposition of the product. Every other story
depends on this core workflow being in place.

**Independent Test**: Can be fully tested by: (1) opening the app with no URL parameters,
(2) entering a valid schema, (3) verifying the form renders with correct fields, (4) entering
values including at least one sensitive field and verifying it is masked, (5) entering a valid
public key, (6) triggering encryption, and (7) verifying a valid encrypted payload appears and
can be copied.

**Acceptance Scenarios**:

1. **Given** a user opens the app with no URL parameters, **When** they enter a valid schema
   into the schema input area and confirm it, **Then** the app renders a form with one input
   field per schema property, labeled using the schema property name or title.

2. **Given** a form is rendered from a schema that marks one or more fields as sensitive,
   **When** the user types into a sensitive field, **Then** the entered characters are masked
   (displayed as dots or asterisks) and the actual value is never shown in plain text.

3. **Given** a user has filled all form fields and entered a valid public encryption key,
   **When** they click "Encrypt", **Then** the app displays a complete encrypted payload
   string in a read-only output area.

4. **Given** an encrypted payload is displayed in the output area, **When** the user clicks
   "Copy", **Then** the full payload is copied to the clipboard and a visual confirmation
   (e.g., "Copied!") is briefly shown.

5. **Given** a user clicks "Encrypt" while one or more required fields are empty, **When** the
   validation runs, **Then** each missing required field is highlighted with an error indicator
   and no encryption is attempted.

6. **Given** a user enters an invalid or unrecognized public encryption key, **When** they
   click "Encrypt", **Then** the app shows a clear error message explaining the key problem
   without clearing any entered form data.

---

### User Story 2 - URL Parameter Pre-configuration (Priority: P2)

An operator or power user constructs a shareable URL that embeds the schema and/or the public
encryption key as query parameters. A recipient opens that link and sees a ready-to-fill form
— they do not need to enter or understand the schema or key themselves.

**Why this priority**: Without pre-configuration via URL, the tool requires every end user to
understand and manually enter both the schema and the encryption key, which is impractical for
most real-world deployments. URL parameters transform the tool from a developer utility into a
reusable, distributable form.

**Independent Test**: Can be fully tested by: (1) constructing a URL with `schema` and `key`
query parameters, (2) opening that URL, (3) verifying the form is immediately rendered and the
key field is pre-filled, (4) filling in only the data fields, and (5) completing encryption
without any manual schema or key entry.

**Acceptance Scenarios**:

1. **Given** the app URL contains a `schema` query parameter with a URL-encoded schema value,
   **When** the page loads, **Then** the schema is pre-loaded and the form is rendered
   immediately without the user entering anything.

2. **Given** the app URL contains a `key` query parameter with a URL-encoded public encryption
   key, **When** the page loads, **Then** the key input field is pre-populated with that key.

3. **Given** both `schema` and `key` are supplied as URL parameters, **When** the page loads,
   **Then** the user sees a fully rendered form with the key pre-filled — the only action
   required is filling in the data fields and clicking "Encrypt".

4. **Given** the `schema` URL parameter contains malformed JSON, **When** the page loads,
   **Then** the app displays a descriptive error message identifying that the schema parameter
   is invalid, without preventing the rest of the page from loading.

5. **Given** the `key` URL parameter contains an unrecognizable key value, **When** the page
   loads, **Then** the app displays a descriptive error message for the key parameter but still
   renders any valid schema from the `schema` parameter.

---

### Edge Cases

- What happens when the schema defines no properties? The app displays an informative message
  ("No fields defined in schema") rather than an empty form.
- What happens when the schema has required fields and the user tries to encrypt without filling
  them? Required fields are highlighted before encryption proceeds.
- What happens when the user's browser does not support clipboard write access? The "Copy"
  button falls back to selecting the output text for manual copying and displays a message
  directing the user to copy manually.
- What happens when a URL parameter schema is too large to fit within practical URL length
  limits? Out of scope — no server-side shortening or storage is provided.
- What happens when the provided public key is valid but incompatible with the encryption
  algorithm in use? The app shows a clear error naming the incompatibility without losing
  entered form data.
- What happens if the user changes the schema after already filling in the form? The form
  resets and previously entered data is cleared, with a confirmation prompt before clearing.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST provide an input area where a user can enter a declarative schema
  that defines the structure of the data to collect.
- **FR-002**: The app MUST render a form with one input field per property defined in the
  schema, using each property's name or title as its visible label.
- **FR-003**: The app MUST render input fields marked as sensitive in the schema with character
  masking active — typed characters MUST NOT be displayed in plain text.
- **FR-004**: The app MUST provide an input field where the user can enter a public encryption
  key to be used for encrypting the form data.
- **FR-005**: The app MUST compose a JSON object from the entered form field values and encrypt
  it into a standards-compliant JWE compact-serialized payload using the provided public key.
- **FR-006**: The app MUST display the resulting encrypted payload in a read-only output area
  after successful encryption.
- **FR-007**: The app MUST provide a one-click "Copy" action that places the full encrypted
  payload onto the user's clipboard.
- **FR-008**: The app MUST accept a URL query parameter named `schema` containing a
  URL-encoded schema definition and pre-populate the schema input and rendered form on page
  load.
- **FR-009**: The app MUST accept a URL query parameter named `key` containing a URL-encoded
  public encryption key and pre-populate the key input field on page load.
- **FR-010**: The app MUST validate that all required fields (as defined in the schema) have
  values before encryption, and MUST display field-level error indicators for any that are
  empty.
- **FR-011**: The app MUST display a clear, human-readable error message when encryption cannot
  be completed (e.g., invalid key format, unsupported key type, algorithm mismatch).
- **FR-012**: The app MUST perform all operations — schema parsing, form rendering, data
  collection, and encryption — entirely within the user's browser. No user data, key material,
  or schema content is transmitted to any server at any point.
- **FR-013**: When the user modifies the schema after entering form data, the app MUST prompt
  for confirmation before clearing the previously entered form values.

### Key Entities

- **Schema**: A declarative definition of the form fields to render — including field names,
  data types, human-readable labels, which fields are required, and which fields are sensitive.
  Provided by the operator; processed only in the browser.
- **Form Data**: The collection of field name / value pairs entered by the user. Exists only
  in the browser as transient state. The plaintext form data is never transmitted or persisted.
- **Public Encryption Key**: An asymmetric public key provided by the intended recipient of
  the encrypted payload. Supplied manually or via URL parameter; never transmitted.
- **Encrypted Payload (JWE)**: The output of the encryption step — a compact-serialized,
  standards-compliant encrypted container holding the form data JSON. This is the only
  artifact the user takes out of the app (via copy/paste).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A user can complete the full encrypt workflow — enter schema, fill a 10-field
  form, enter a key, and copy the encrypted payload — in under 3 minutes.
- **SC-002**: When a URL with both `schema` and `key` parameters is opened, the form is fully
  rendered and the key field is pre-populated within 2 seconds on a standard broadband
  connection, with no user interaction required.
- **SC-003**: Zero network requests carrying user-entered data, key material, or schema content
  are made during any part of the encryption workflow (verifiable via browser developer tools
  network panel).
- **SC-004**: Sensitive fields are masked on first render — no plaintext character from a
  sensitive field is ever visually displayed in the browser.
- **SC-005**: Invalid URL parameter values produce a visible, descriptive error message within
  1 second of page load and do not prevent valid parameters from being applied.
- **SC-006**: The encrypted JWE payload produced by the app can be successfully decrypted by
  the holder of the corresponding private key using any standards-compliant JWE
  implementation, with no data loss or corruption.

## Assumptions

- **Schema format**: JSON Schema (draft-07 compatible subset) is used as the schema definition
  language. It is widely adopted and its structure (properties, required, type, title) maps
  naturally to form fields.
- **Sensitive field designation**: A field is designated as sensitive by including
  `"x-sensitive": true` as a custom extension property within that field's schema definition.
- **Public key format**: The app accepts public keys in JWK (JSON Web Key) format, which is
  the native format for browser-based cryptographic operations and aligns with the JWE
  standard. PEM support is out of scope for this iteration.
- **No data persistence**: No form data, schema, key material, or encrypted payload is written
  to browser storage (localStorage, sessionStorage, cookies) between sessions. All state is
  session-transient.
- **Single form per page**: The app renders one schema-driven form at a time. Replacing the
  schema replaces the form.
- **Clipboard fallback**: If the browser does not permit clipboard write access, the output
  area will be selected so the user can copy manually.
