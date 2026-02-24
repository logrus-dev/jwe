# Feature Specification: URL Parameter Auto-Hide Steps

**Feature Branch**: `001-url-param-hide-steps`
**Created**: 2026-02-24
**Status**: Draft
**Input**: User description: "if schema was specified in URL query param - corresponding UI text box should be hidden. if key was specified in URL query parameter - corresponding ui text box should be hidden. Basically, if both query parameters are specified - only the rendered form should be shown and the result encrypted material"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Focused Encrypt Mode: Both Parameters Pre-Filled (Priority: P1)

A link author shares a URL containing both a pre-configured schema and a public key. Recipients who open the link see only the data-entry form and the encrypted output — no schema editor, no key input. They fill in the form and immediately get the encrypted result, with no extraneous controls to confuse them.

**Why this priority**: This is the primary described use case. Hiding both inputs produces the highest-value outcome: a distraction-free, purpose-built encryption form that non-technical recipients can use without needing to understand what a JSON Schema or JWK is.

**Independent Test**: Construct a URL with valid `?schema=<encoded>` and `?key=<encoded>` parameters; open it in a fresh browser session; verify that only the form and the encrypted output section are visible — the schema text area and the key text area must not appear on the page.

**Acceptance Scenarios**:

1. **Given** a URL contains both a valid `?schema=` and a valid `?key=` parameter, **When** the page loads, **Then** only the data-entry form and the encrypted output section are displayed; the schema input and key input sections are not visible.
2. **Given** the focused view is active, **When** the user fills in the form and submits, **Then** the encrypted output is produced exactly as it would be in the full view.
3. **Given** the focused view is active, **When** the user refreshes the page, **Then** the same focused view is restored (parameters remain in the URL).

---

### User Story 2 - Schema Pre-Filled via URL (Priority: P2)

A link author shares a URL containing only a pre-configured schema. Recipients see the form pre-rendered from that schema and the public key input, but not the schema text area. They provide their own key and complete the encryption workflow.

**Why this priority**: Hiding only the schema gives a cleaner experience for cases where the schema is fixed but the key varies per recipient or per session.

**Independent Test**: Open a URL with only `?schema=<encoded>` and no `?key=` parameter; verify the schema text area is not visible but the key input and the form are displayed.

**Acceptance Scenarios**:

1. **Given** a URL contains a valid `?schema=` parameter but no `?key=` parameter, **When** the page loads, **Then** the schema input section is not visible and the form is rendered from the URL-provided schema.
2. **Given** the schema input is hidden, **When** the user enters a public key and fills in the form, **Then** the encryption workflow completes successfully.

---

### User Story 3 - Key Pre-Filled via URL (Priority: P3)

A link author shares a URL containing only a public key. Recipients see the schema input and the form (once a schema is entered), but not the key text area — the key is silently provided by the URL.

**Why this priority**: Useful when a team wants to standardise on a particular encryption key without exposing it as an editable field, while still allowing the schema to vary.

**Independent Test**: Open a URL with only `?key=<encoded>` and no `?schema=` parameter; verify the key input section is not visible but the schema text area and form are accessible.

**Acceptance Scenarios**:

1. **Given** a URL contains a valid `?key=` parameter but no `?schema=` parameter, **When** the page loads, **Then** the key input section is not visible.
2. **Given** the key input is hidden, **When** the user provides a schema, fills in the form, and submits, **Then** the encryption uses the URL-provided key and produces a valid encrypted output.

---

### Edge Cases

- What happens when `?schema=` is present but contains invalid or malformed content? The form cannot be rendered; an error message must appear in place of the form (the schema section remains hidden — the error is shown inline, not by revealing the schema editor).
- What happens when `?key=` is present but contains an invalid key value? The encrypted output section must display a validation error; the key input remains hidden.
- What happens when a query parameter is present but empty (e.g., `?schema=`)? Treat as absent — show the corresponding input section normally.
- What happens when the user navigates back/forward in browser history? The hidden/visible state must reflect the current URL parameters at all times.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: When the `schema` URL query parameter is present and non-empty, the schema text input section MUST NOT be rendered on the page.
- **FR-002**: When the `key` URL query parameter is present and non-empty, the public key input section MUST NOT be rendered on the page.
- **FR-003**: When both `schema` and `key` URL query parameters are present and non-empty, ONLY the data-entry form and the encrypted output section MUST be visible; all other input sections MUST be hidden.
- **FR-004**: Hiding an input section MUST NOT affect the functionality it provides — the pre-filled value from the URL MUST still be used for form rendering and encryption.
- **FR-005**: When a URL parameter is absent or empty, the corresponding input section MUST be displayed as normal, with no change to existing behaviour.
- **FR-006**: If a pre-filled schema value is invalid, an error message MUST be displayed in place of the form; the schema input section MUST remain hidden.
- **FR-007**: If a pre-filled key value is invalid, an error message MUST be displayed in the output section; the key input section MUST remain hidden.
- **FR-008**: Hidden sections MUST NOT be accessible via any toggle, reveal control, or keyboard shortcut — the values are considered fixed for the session.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Opening a URL with both parameters set results in a page that shows exactly two visible sections (form and output) — zero schema or key input sections visible.
- **SC-002**: The encryption result produced in focused mode is identical to the result produced in full mode given the same schema, key, and form data.
- **SC-003**: A user with no knowledge of JSON Schema or JWK can successfully complete and encrypt a form when both parameters are pre-filled, without encountering any visible configuration controls.
- **SC-004**: All three hiding scenarios (schema only, key only, both) activate on first page load with no visible flash of hidden content before hiding occurs.

## Assumptions

- The URL parameter names are `schema` and `key`, matching the existing URL parameter parsing already in the application.
- "Hidden" means the section is not rendered in the page at all, not merely visually invisible.
- There is no mechanism to reveal a hidden section during the session; the URL is the sole configuration source.
- An empty query parameter value (e.g., `?schema=`) is treated identically to the parameter being absent — the input section is shown.
- The encrypted output section behaves identically whether other sections are hidden or not — no functional changes to the encryption step itself.
