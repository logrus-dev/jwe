import type { RJSFSchema, UiSchema } from '@rjsf/utils';

export interface SchemaResult {
  parsed: RJSFSchema | null;
  isValid: boolean;
  error: string | null;
  hasProperties: boolean;
}

export function parseSchema(raw: string): SchemaResult {
  if (!raw.trim()) {
    return { parsed: null, isValid: false, error: null, hasProperties: false };
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    return {
      parsed: null,
      isValid: false,
      error: `Invalid JSON: ${e instanceof Error ? e.message : String(e)}`,
      hasProperties: false,
    };
  }

  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      parsed: null,
      isValid: false,
      error: 'Schema must be a JSON object',
      hasProperties: false,
    };
  }

  const schema = parsed as RJSFSchema;
  const hasProperties =
    typeof schema.properties === 'object' &&
    schema.properties !== null &&
    Object.keys(schema.properties).length > 0;

  return { parsed: schema, isValid: true, error: null, hasProperties };
}

export function deriveUiSchema(schema: RJSFSchema): UiSchema {
  const uiSchema: UiSchema = {
    'ui:submitButtonOptions': { norender: true },
  };

  if (!schema.properties) return uiSchema;

  for (const [key, fieldSchema] of Object.entries(schema.properties)) {
    if (typeof fieldSchema === 'object' && fieldSchema !== null) {
      const field = fieldSchema as Record<string, unknown>;
      if (field['x-sensitive'] === true) {
        uiSchema[key] = { 'ui:widget': 'password' };
      }
    }
  }

  return uiSchema;
}
