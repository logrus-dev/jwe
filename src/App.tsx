import { useEffect, useState } from 'react';
import {
  AppShell,
  Container,
  Title,
  Text,
  Card,
  Stack,
  Group,
  Badge,
  Alert,
  CloseButton,
  ActionIcon,
  useMantineColorScheme,
  Anchor,
} from '@mantine/core';
import { IconSun, IconMoon, IconShieldLock } from '@tabler/icons-react';

import { SchemaInput } from './components/SchemaInput';
import { DynamicForm } from './components/DynamicForm';
import { PublicKeyInput, type KeyState } from './components/PublicKeyInput';
import { EncryptedOutput } from './components/EncryptedOutput';
import { parseSchema, deriveUiSchema, type SchemaResult } from './utils/schemaUtils';
import { readUrlParams, decodeBase64UrlParam } from './utils/urlParams';
import { validateAndImportKey } from './utils/encrypt';
import type { UiSchema } from '@rjsf/utils';

const EMPTY_SCHEMA: SchemaResult = {
  parsed: null,
  isValid: false,
  error: null,
  hasProperties: false,
};

const EMPTY_KEY: KeyState = {
  raw: '',
  cryptoKey: null,
  isValid: false,
  error: null,
};

function ColorSchemeToggle() {
  const { colorScheme, toggleColorScheme } = useMantineColorScheme();
  return (
    <ActionIcon variant="subtle" size="lg" onClick={() => toggleColorScheme()} title="Toggle color scheme">
      {colorScheme === 'dark' ? <IconSun size={20} /> : <IconMoon size={20} />}
    </ActionIcon>
  );
}

export default function App() {
  const [schemaRaw, setSchemaRaw] = useState('');
  const [schemaState, setSchemaState] = useState<SchemaResult>(EMPTY_SCHEMA);
  const [uiSchema, setUiSchema] = useState<UiSchema>({});
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [keyState, setKeyState] = useState<KeyState>(EMPTY_KEY);
  const [output, setOutput] = useState<string | null>(null);
  const [urlErrors, setUrlErrors] = useState<{ schema?: string; key?: string }>({});

  // T016 + T017: URL parameter pre-loading on mount
  useEffect(() => {
    const params = readUrlParams();
    const errors: { schema?: string; key?: string } = {};

    if (params.schema) {
      const schemaDecode = decodeBase64UrlParam(params.schema);
      if (schemaDecode.error !== null) {
        errors.schema = schemaDecode.error;
      } else {
        const result = parseSchema(schemaDecode.value);
        if (result.isValid) {
          setSchemaRaw(schemaDecode.value);
          setSchemaState(result);
          setUiSchema(deriveUiSchema(result.parsed!));
          setFormData({});
        } else {
          errors.schema = result.error ?? 'Invalid schema in URL parameter';
        }
      }
    }

    if (params.key) {
      const keyDecode = decodeBase64UrlParam(params.key);
      if (keyDecode.error !== null) {
        setUrlErrors((prev) => ({ ...prev, key: keyDecode.error }));
      } else {
        validateAndImportKey(keyDecode.value)
          .then(({ cryptoKey }) => {
            setKeyState({ raw: keyDecode.value, cryptoKey, isValid: true, error: null });
          })
          .catch((e: Error) => {
            setUrlErrors((prev) => ({
              ...prev,
              key: e.message ?? 'Invalid key in URL parameter',
            }));
          });
      }
    }

    if (Object.keys(errors).length > 0) {
      setUrlErrors(errors);
    }
  }, []);

  function handleSchemaChange(raw: string) {
    setSchemaRaw(raw);
  }

  function handleRender(raw: string) {
    const result = parseSchema(raw);
    setSchemaState(result);
    if (result.isValid && result.parsed) {
      setUiSchema(deriveUiSchema(result.parsed));
    } else {
      setUiSchema({});
    }
    setFormData({});
    setOutput(null);
  }

  function handleFormChange(data: Record<string, unknown>) {
    setFormData(data);
    setOutput(null);
  }

  function handleKeyStateChange(state: KeyState) {
    setKeyState(state);
    setOutput(null);
  }

  // Synchronous lazy initializers — computed on first render, never updated.
  // Prevents flash of hidden content on load (SC-004). No setter: values are
  // fixed for the session lifetime per FR-008.
  const [schemaFromUrl] = useState(() => {
    const p = readUrlParams();
    return p.schema !== null && p.schema !== '';
  });
  const [keyFromUrl] = useState(() => {
    const p = readUrlParams();
    return p.key !== null && p.key !== '';
  });

  const hasFormData = Object.keys(formData).length > 0;

  return (
    <AppShell header={{ height: 60 }} padding="md">
      <AppShell.Header>
        <Container size="md" h="100%">
          <Group h="100%" justify="space-between">
            <Group gap="xs">
              <IconShieldLock size={24} color="var(--mantine-color-blue-6)" />
              <Title order={3} fw={700}>JWE Form Encryptor</Title>
              <Badge variant="light" color="blue" size="sm">client-side only</Badge>
            </Group>
            <Group gap="xs">
              <Text size="xs" c="dimmed">No data leaves your browser</Text>
              <ColorSchemeToggle />
            </Group>
          </Group>
        </Container>
      </AppShell.Header>

      <AppShell.Main>
        {/* T021: Responsive centered layout */}
        <Container size="md" py="xl">
          <Stack gap="lg">
            {/* T018: URL param error banners */}
            {urlErrors.schema && (
              <Alert
                color="red"
                title="URL schema parameter is invalid"
                withCloseButton
                onClose={() => setUrlErrors((e) => ({ ...e, schema: undefined }))}
                icon={<CloseButton />}
              >
                {urlErrors.schema}
              </Alert>
            )}
            {urlErrors.key && (
              <Alert
                color="red"
                title="URL key parameter is invalid"
                withCloseButton
                onClose={() => setUrlErrors((e) => ({ ...e, key: undefined }))}
                icon={<CloseButton />}
              >
                {urlErrors.key}
              </Alert>
            )}

            {/* Step 1: Schema — hidden when ?schema= URL param is present and non-empty (FR-001) */}
            {!schemaFromUrl && (
              <Card withBorder shadow="sm" radius="md" padding="lg">
                <Stack gap="sm">
                  <Group>
                    <Badge variant="filled" color="blue" size="lg">Step 1</Badge>
                    <Title order={5}>Define Schema</Title>
                  </Group>
                  <SchemaInput
                    value={schemaRaw}
                    schemaState={schemaState}
                    hasFormData={hasFormData}
                    onChange={handleSchemaChange}
                    onRender={handleRender}
                  />
                </Stack>
              </Card>
            )}

            {/* Step 2: Dynamic Form (only when schema is valid) */}
            {schemaState.isValid && schemaState.parsed && (
              <Card withBorder shadow="sm" radius="md" padding="lg">
                <Stack gap="sm">
                  <Group>
                    <Badge variant="filled" color="blue" size="lg">Step 2</Badge>
                    <Title order={5}>Fill the Form</Title>
                  </Group>
                  <DynamicForm
                    schema={schemaState.parsed}
                    uiSchema={uiSchema}
                    formData={formData}
                    onChange={handleFormChange}
                  />
                </Stack>
              </Card>
            )}

            {/* Step 3: Public Key — hidden when ?key= URL param is present and non-empty (FR-002) */}
            {!keyFromUrl && (
              <Card withBorder shadow="sm" radius="md" padding="lg">
                <Stack gap="sm">
                  <Group>
                    <Badge variant="filled" color="blue" size="lg">Step 3</Badge>
                    <Title order={5}>Provide Encryption Key</Title>
                  </Group>
                  <PublicKeyInput
                    keyState={keyState}
                    onKeyStateChange={handleKeyStateChange}
                  />
                </Stack>
              </Card>
            )}

            {/* Step 4: Encrypt + Output */}
            <Card withBorder shadow="sm" radius="md" padding="lg">
              <Stack gap="sm">
                <Group>
                  <Badge variant="filled" color="blue" size="lg">Step 4</Badge>
                  <Title order={5}>Encrypt &amp; Copy</Title>
                </Group>
                <EncryptedOutput
                  formData={formData}
                  keyState={keyState}
                  schemaState={schemaState}
                  output={output}
                  onOutput={setOutput}
                />
              </Stack>
            </Card>

            <Text size="xs" c="dimmed" ta="center">
              All encryption happens in your browser.{' '}
              <Anchor size="xs" href="https://www.rfc-editor.org/rfc/rfc7516" target="_blank" rel="noopener noreferrer">
                JWE RFC 7516
              </Anchor>
              {' '}· RSA-OAEP-256 + A256GCM
            </Text>
          </Stack>
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}
