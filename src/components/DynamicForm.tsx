import Form from '@rjsf/mantine';
import validator from '@rjsf/validator-ajv8';
import type { IChangeEvent } from '@rjsf/core';
import type { RJSFSchema, UiSchema } from '@rjsf/utils';
import { Alert } from '@mantine/core';
import { IconAlertCircle } from '@tabler/icons-react';

interface DynamicFormProps {
  schema: RJSFSchema;
  uiSchema: UiSchema;
  formData: Record<string, unknown>;
  onChange: (data: Record<string, unknown>) => void;
}

export function DynamicForm({ schema, uiSchema, formData, onChange }: DynamicFormProps) {
  if (!schema.properties || Object.keys(schema.properties).length === 0) {
    return (
      <Alert icon={<IconAlertCircle size={16} />} color="yellow">
        No fields defined in the schema.
      </Alert>
    );
  }

  function handleChange(e: IChangeEvent<Record<string, unknown>>) {
    onChange(e.formData ?? {});
  }

  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      formData={formData}
      validator={validator}
      onChange={handleChange}
      liveValidate={false}
    >
      {/* Hide RJSF default submit button — Encrypt button is in Step 4 */}
      <></>
    </Form>
  );
}
