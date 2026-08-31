import { describe, expect, it } from 'vitest';

import { ARGON2_OPTIONS, hashPassword, verifyPassword } from './password.service';

describe('password.service', () => {
  describe('hashPassword', () => {
    it('produz um hash argon2id com os parâmetros do OWASP', async () => {
      const hash = await hashPassword('senha-de-teste-123');

      // Os parâmetros ficam gravados no próprio hash. Assertar sobre eles é o
      // que impede uma troca acidental de algoritmo (para argon2i/argon2d ou
      // para um custo mais baixo) de passar despercebida.
      expect(hash).toMatch(/^\$argon2id\$v=19\$m=19456,t=2,p=1\$/);
    });

    it('nunca contém a senha em texto claro', async () => {
      const plainPassword = 'senha-de-teste-123';
      const hash = await hashPassword(plainPassword);

      expect(hash).not.toContain(plainPassword);
    });

    it('gera hashes diferentes para a mesma senha (salt aleatório)', async () => {
      const [first, second] = await Promise.all([
        hashPassword('mesma-senha-forte'),
        hashPassword('mesma-senha-forte'),
      ]);

      expect(first).not.toBe(second);
    });
  });

  describe('verifyPassword', () => {
    it('aceita a senha correta', async () => {
      const hash = await hashPassword('senha-correta-987');

      await expect(verifyPassword(hash, 'senha-correta-987')).resolves.toBe(true);
    });

    it('recusa a senha errada', async () => {
      const hash = await hashPassword('senha-correta-987');

      await expect(verifyPassword(hash, 'senha-errada-987')).resolves.toBe(false);
    });

    it('recusa diferença de caixa na senha', async () => {
      const hash = await hashPassword('SenhaComCaixa');

      await expect(verifyPassword(hash, 'senhacomcaixa')).resolves.toBe(false);
    });

    it('retorna false — em vez de lançar — para um hash corrompido', async () => {
      await expect(verifyPassword('nao-e-um-hash-argon2', 'qualquer')).resolves.toBe(false);
      await expect(verifyPassword('', 'qualquer')).resolves.toBe(false);
    });
  });

  it('expõe os parâmetros de custo recomendados pelo OWASP', () => {
    expect(ARGON2_OPTIONS).toEqual({
      algorithm: 2, // Argon2id
      memoryCost: 19_456,
      timeCost: 2,
      parallelism: 1,
    });
  });
});
