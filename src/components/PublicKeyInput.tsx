import { Textarea, Badge, Stack, Text } from '@mantine/core';
import { IconCheck, IconAlertCircle } from '@tabler/icons-react';
import { validateAndImportKey } from '../utils/encrypt';
export interface KeyState {
  raw: string;
  cryptoKey: CryptoKey | null;
  isValid: boolean;
  error: string | null;
}

interface PublicKeyInputProps {
  keyState: KeyState;
  onKeyStateChange: (state: KeyState) => void;
}

export function PublicKeyInput({ keyState, onKeyStateChange }: PublicKeyInputProps) {
  async function handleChange(raw: string) {
    if (!raw.trim()) {
      onKeyStateChange({ raw, cryptoKey: null, isValid: false, error: null });
      return;
    }

    try {
      const { cryptoKey } = await validateAndImportKey(raw);
      onKeyStateChange({ raw, cryptoKey, isValid: true, error: null });
    } catch (e) {
      onKeyStateChange({
        raw,
        cryptoKey: null,
        isValid: false,
        error: e instanceof Error ? e.message : 'Key import failed',
      });
    }
  }

  return (
    <Stack gap="sm">
      <Textarea
        label="JWK Public Key"
        description="Paste the recipient's RSA public key in JWK (JSON Web Key) format"
        placeholder='{ "kty": "RSA", "n": "...", "e": "AQAB", ... }'
        value={keyState.raw}
        onChange={(e) => handleChange(e.currentTarget.value)}
        minRows={4}
        autosize
        styles={{ input: { fontFamily: 'monospace', fontSize: '0.85rem' } }}
      />

      {keyState.isValid && (
        <Badge color="green" leftSection={<IconCheck size={12} />} w="fit-content">
          Key ready
        </Badge>
      )}

      {keyState.error && (
        <Text size="sm" c="red">
          <IconAlertCircle size={14} style={{ verticalAlign: 'middle', marginRight: 4 }} />
          {keyState.error}
        </Text>
      )}
    </Stack>
  );
}
