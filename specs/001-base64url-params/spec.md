# Feature Specification: Base64URL-Encoded URL Parameters

**Feature Branch**: `001-base64url-params`
**Created**: 2026-02-25
**Status**: Draft
**Input**: User description: "url params (schema and key) should be base64-url encoded"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Open Pre-configured Form via Shared URL (Priority: P1)

A user receives a shareable link containing both a JSON Schema and a JWK public key embedded as base64url-encoded URL parameters. When they open the link, the form pre-populates both the schema input and the key input automatically, ready to fill in and encrypt.

**Why this priority**: This is the primary use case — sharing a pre-configured JWE form via URL. Base64url encoding ensures JSON content (with braces, quotes, colons) embeds cleanly in a URL without percent-encoding explosion.

**Independent Test**: Can be fully tested by constructing a URL with `?schema=<base64url-encoded-json>&key=<base64url-encoded-jwk>`, opening it in a browser, and verifying both fields are pre-populated correctly.

**Acceptance Scenarios**:

1. **Given** a URL with a valid base64url-encoded JSON Schema in the `?schema=` parameter, **When** the page loads, **Then** the schema input is pre-populated with the decoded JSON Schema text.
2. **Given** a URL with a valid base64url-encoded JWK in the `?key=` parameter, **When** the page loads, **Then** the public key input is pre-populated with the decoded JWK text.
3. **Given** a URL with both `?schema=` and `?key=` parameters as valid base64url-encoded values, **When** the page loads, **Then** both fields are pre-populated and the user can immediately proceed to fill in the form and encrypt.
4. **Given** a URL with no URL parameters, **When** the page loads, **Then** the form loads normally with empty inputs and no errors.

---

### User Story 2 - Graceful Handling of Invalid Encoded Parameters (Priority: P2)

A user opens a URL with a malformed or corrupted base64url-encoded parameter. The application detects the issue and shows a clear, actionable error message rather than silently failing or displaying garbled content.

**Why this priority**: Error handling is essential for a good user experience and to prevent silent data corruption when links are damaged or manually edited.

**Independent Test**: Can be fully tested by constructing URLs with deliberately broken base64url values and verifying the error messages appear.

**Acceptance Scenarios**:

1. **Given** a URL where `?schema=` contains an invalid base64url string, **When** the page loads, **Then** an error is shown indicating the schema parameter could not be decoded, and the schema input remains empty.
2. **Given** a URL where `?key=` contains an invalid base64url string, **When** the page loads, **Then** an error is shown indicating the key parameter could not be decoded, and the key input remains empty.
3. **Given** a URL where `?schema=` is valid base64url but decodes to non-JSON content, **When** the page loads, **Then** an error is shown indicating the decoded content is not valid JSON, and the schema input remains empty.
4. **Given** a URL where `?key=` is valid base64url but decodes to non-JSON content, **When** the page loads, **Then** an error is shown indicating the decoded content is not valid JSON, and the key input remains empty.

---

### Edge Cases

- What happens when `?schema=` or `?key=` is present but empty (e.g., `?schema=` with no value)?
- What happens when the decoded JSON is valid syntax but semantically invalid (e.g., schema is `{}`)?
- How does the system handle base64url values with padding characters (`=`) vs. without?
- What happens when a URL parameter value is so large it approaches browser URL length limits?
- Any `?schema=` or `?key=` value that is not valid base64url is treated as an error — no fallback to plain-text parsing. Previously shared plain-text URLs will no longer work.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The app MUST decode the `?schema=` URL parameter using base64url decoding before attempting to parse it as a JSON Schema.
- **FR-002**: The app MUST decode the `?key=` URL parameter using base64url decoding before attempting to parse it as a JWK public key.
- **FR-003**: When a `?schema=` parameter is present and decodes to a valid JSON string, the app MUST pre-populate the schema input field with the decoded value on page load.
- **FR-004**: When a `?key=` parameter is present and decodes to a valid JSON string, the app MUST pre-populate the public key input field with the decoded value on page load.
- **FR-005**: When a `?schema=` or `?key=` parameter fails base64url decoding, the app MUST display an error notification describing which parameter failed.
- **FR-006**: When a `?schema=` or `?key=` parameter decodes successfully but the result is not valid JSON, the app MUST display an error notification describing which parameter produced invalid JSON.
- **FR-007**: When a `?schema=` or `?key=` parameter is absent or empty, the app MUST silently skip pre-population for that field with no error.

### Key Entities

- **Schema Parameter**: The `?schema=` URL query parameter — carries a base64url-encoded JSON Schema string to pre-populate the schema input field.
- **Key Parameter**: The `?key=` URL query parameter — carries a base64url-encoded JWK public key string to pre-populate the public key input field.
- **Base64URL Encoding**: The URL-safe variant of Base64 (RFC 4648 §5) that uses `-` and `_` instead of `+` and `/`, allowing JSON content to embed in URLs without percent-encoding.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A URL with valid base64url-encoded `?schema=` and `?key=` parameters pre-populates both input fields correctly on every page load with zero additional user interaction.
- **SC-002**: An invalid or malformed base64url URL parameter always produces a visible, descriptive error message — never silent failure or garbled content in an input field.
- **SC-003**: Base64url-encoded JSON content in URL parameters requires no additional percent-encoding for typical JSON structures (objects with string keys and values), resulting in cleaner shareable URLs.
- **SC-004**: The existing behavior of the form when no URL parameters are present is unchanged — no regressions in normal usage.

## Assumptions

- The existing `?schema=` and `?key=` URL param feature (from 001-url-param-hide-steps) currently parses param values as raw (percent-decoded) text. This feature changes the expected encoding to base64url.
- Base64url decoding follows RFC 4648 §5 (URL-safe alphabet, padding optional).
- Both parameters are optional; absence of either causes no error.
- The app is a client-side SPA — URL parameter parsing happens entirely in the browser on page load.
- Excessively long base64url values may fail silently in some browsers due to URL length limits; this is a known browser constraint, not a requirement to solve in the app.
