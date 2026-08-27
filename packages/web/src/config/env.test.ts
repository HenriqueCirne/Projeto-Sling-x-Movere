import { describe, expect, it } from 'vitest';

import { parseEnv } from './env';

describe('parseEnv', () => {
  it('usa development como NODE_ENV padrão', () => {
    expect(parseEnv({}).NODE_ENV).toBe('development');
  });

  it('lê DATABASE_URL quando presente', () => {
    const env = parseEnv({ DATABASE_URL: 'postgresql://user:pass@localhost:5432/db' });

    expect(env.DATABASE_URL).toBe('postgresql://user:pass@localhost:5432/db');
  });

  it('trata DATABASE_URL vazia como ausente (e não como valor válido)', () => {
    expect(parseEnv({ DATABASE_URL: '' }).DATABASE_URL).toBeUndefined();
    expect(parseEnv({ DATABASE_URL: '   ' }).DATABASE_URL).toBeUndefined();
  });

  it('rejeita NODE_ENV desconhecido', () => {
    expect(() => parseEnv({ NODE_ENV: 'staging' as never })).toThrow();
  });
});
