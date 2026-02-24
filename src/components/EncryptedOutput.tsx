import { useState } from 'react';
import {
  Button,
  Stack,
  Group,
  ActionIcon,
  CopyButton,
  Tooltip,
  Text,
  Alert,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { CodeHighlight } from '@mantine/code-highlight';
import { IconLock, IconCopy, IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { encryptPayload } from '../utils/encrypt';
import type { KeyState } from './PublicKeyInput';
import type { SchemaResult } from '../utils/schemaUtils';
import type { RJSFSchema } from '@rjsf/utils';

interface EncryptedOutputProps {
  formData: Record<string, unknown>;
  keyState: KeyState;
  schemaState: SchemaResult;
  onOutput: (value: string) => void;
  output: string | null;
}

export function EncryptedOutput({
  formData,
  keyState,
  schemaState,
  onOutput,
  output,
}: EncryptedOutputProps) {
  const [encrypting, setEncrypting] = useState(false);

  const canEncrypt = schemaState.isValid && schemaState.hasProperties && keyState.isValid;

  async function handleEncrypt() {
    if (!keyState.cryptoKey) {
      notifications.show({
        color: 'red',
        title: 'No encryption key',
        message: 'Please enter a valid JWK public key.',
      });
      return;
    }

    const schema = schemaState.parsed as RJSFSchema;
    const required = (schema.required ?? []) as string[];
    const missing = required.filter(
      (field) => formData[field] === undefined || formData[field] === '' || formData[field] === null,
    );

    if (missing.length > 0) {
      notifications.show({
        color: 'orange',
        title: 'Missing required fields',
        message: `Please fill in: ${missing.join(', ')}`,
      });
      return;
    }

    setEncrypting(true);
    try {
      const jwe = await encryptPayload(formData, keyState.cryptoKey);
      onOutput(jwe);
    } catch (e) {
      notifications.show({
        color: 'red',
        title: 'Encryption failed',
        message: e instanceof Error ? e.message : 'Unknown error',
      });
    } finally {
      setEncrypting(false);
    }
  }

  return (
    <Stack gap="md">
      <Button
        leftSection={<IconLock size={16} />}
        onClick={handleEncrypt}
        loading={encrypting}
        disabled={!canEncrypt}
        size="md"
      >
        Encrypt
      </Button>

      {!canEncrypt && (
        <Alert icon={<IconAlertCircle size={14} />} color="gray" variant="light">
          {!schemaState.isValid
            ? 'Provide a valid schema first.'
            : !keyState.isValid
              ? 'Provide a valid JWK public key first.'
              : 'Fill in the form fields above.'}
        </Alert>
      )}

      {output && (
        <Stack gap="xs">
          <Group justify="space-between" align="center">
            <Text size="sm" fw={500}>Encrypted payload (JWE)</Text>
            <CopyButton value={output} timeout={2000}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied!' : 'Copy to clipboard'} withArrow>
                  <ActionIcon
                    color={copied ? 'teal' : 'blue'}
                    variant="light"
                    onClick={copy}
                    size="lg"
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
          </Group>
          <div style={{ wordBreak: 'break-all' }}>
            <CodeHighlight code={output} language="text" />
          </div>
        </Stack>
      )}
    </Stack>
  );
}
