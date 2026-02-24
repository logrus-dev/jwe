import { useState } from 'react';
import {
  Textarea,
  Button,
  Alert,
  Badge,
  Stack,
  Group,
  Modal,
  Text,
} from '@mantine/core';
import { IconAlertCircle, IconCheck, IconAlertTriangle } from '@tabler/icons-react';
import type { SchemaResult } from '../utils/schemaUtils';

interface SchemaInputProps {
  value: string;
  schemaState: SchemaResult;
  hasFormData: boolean;
  onRender: (raw: string) => void;
  onChange: (raw: string) => void;
}

export function SchemaInput({ value, schemaState, hasFormData, onRender, onChange }: SchemaInputProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRender, setPendingRender] = useState<string | null>(null);

  function handleRenderClick() {
    if (hasFormData && schemaState.parsed !== null) {
      setPendingRender(value);
      setConfirmOpen(true);
    } else {
      onRender(value);
    }
  }

  function handleConfirm() {
    setConfirmOpen(false);
    if (pendingRender !== null) {
      onRender(pendingRender);
      setPendingRender(null);
    }
  }

  function handleCancel() {
    setConfirmOpen(false);
    setPendingRender(null);
  }

  return (
    <>
      <Stack gap="sm">
        <Textarea
          label="JSON Schema"
          description='Define your form fields. Mark sensitive fields with "x-sensitive": true'
          placeholder={'{\n  "type": "object",\n  "properties": {\n    "name": { "type": "string", "title": "Full Name" },\n    "secret": { "type": "string", "title": "Secret", "x-sensitive": true }\n  },\n  "required": ["name"]\n}'}
          value={value}
          onChange={(e) => onChange(e.currentTarget.value)}
          minRows={6}
          autosize
          styles={{ input: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
        />

        {schemaState.error && (
          <Alert icon={<IconAlertCircle size={16} />} color="red" title="Schema error">
            {schemaState.error}
          </Alert>
        )}

        {schemaState.isValid && !schemaState.hasProperties && (
          <Alert icon={<IconAlertTriangle size={16} />} color="yellow" title="No fields defined">
            The schema has no properties. Add fields under &quot;properties&quot; to render a form.
          </Alert>
        )}

        <Group>
          <Button onClick={handleRenderClick} disabled={!value.trim()}>
            Render Form
          </Button>
          {schemaState.isValid && schemaState.hasProperties && (
            <Badge color="green" leftSection={<IconCheck size={12} />}>
              Schema valid
            </Badge>
          )}
        </Group>
      </Stack>

      <Modal
        opened={confirmOpen}
        onClose={handleCancel}
        title="Clear form data?"
        centered
      >
        <Stack>
          <Text size="sm">
            Changing the schema will clear all currently entered form data. Continue?
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={handleCancel}>Cancel</Button>
            <Button color="red" onClick={handleConfirm}>Clear and re-render</Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
