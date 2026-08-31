import { describe, expect, it } from 'vitest';

import { isFailedSignInResult } from './sign-in-result.service';

describe('isFailedSignInResult', () => {
  it('reconhece sucesso: URL de redirecionamento sem parâmetro de erro', () => {
    expect(isFailedSignInResult('/dashboard')).toBe(false);
    expect(isFailedSignInResult('http://localhost:3000/dashboard')).toBe(false);
  });

  it('reconhece falha: URL de redirecionamento com parâmetro de erro', () => {
    expect(isFailedSignInResult('/login?error=CredentialsSignin')).toBe(true);
  });

  it('trata retorno vazio ou ausente como falha', () => {
    expect(isFailedSignInResult('')).toBe(true);
    expect(isFailedSignInResult(undefined)).toBe(true);
    expect(isFailedSignInResult(null)).toBe(true);
  });

  it('trata tipo inesperado como falha (na dúvida, não concede acesso)', () => {
    expect(isFailedSignInResult(true)).toBe(true);
    expect(isFailedSignInResult({ error: 'CredentialsSignin' })).toBe(true);
  });

  it('trata string que não é uma URL válida como falha', () => {
    expect(isFailedSignInResult('http://[invalid')).toBe(true);
  });
});
