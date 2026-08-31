import { hash, verify, type Algorithm } from '@node-rs/argon2';

/**
 * Hashing de senha com argon2id (TD-01).
 *
 * ⚠️ **Este módulo é compartilhado com `prisma/seed.ts`**, que roda fora do
 * bundle do Next.js (via `tsx`, a partir da raiz do monorepo). Por isso ele
 * importa APENAS de `node_modules` — nada de alias `@/...`, nada de
 * `next/*`. Quebrar essa regra quebra o seed, não o build da aplicação, e o
 * sintoma aparece longe da causa.
 *
 * A duplicação de parâmetros entre aplicação e seed seria uma fonte silenciosa
 * de bug (senha semeada com um custo, verificada com outro): é exatamente por
 * isso que existe um único módulo.
 */

/**
 * Parâmetros de custo — recomendação OWASP para argon2id
 * (m = 19 MiB, t = 2, p = 1), que é também o mínimo recomendado da RFC 9106.
 *
 * Alterar estes valores NÃO invalida hashes antigos: o argon2 grava os
 * parâmetros no próprio hash (`$argon2id$v=19$m=19456,t=2,p=1$...`) e `verify`
 * usa os do hash armazenado, não os daqui.
 */
/**
 * `Algorithm.Argon2id` do `@node-rs/argon2`.
 *
 * O valor é escrito literalmente porque `Algorithm` é um `const enum` ambiente:
 * sob `isolatedModules` (exigido pelo Next.js) o TypeScript não pode inlinear o
 * membro em tempo de compilação e recusa o acesso `Algorithm.Argon2id`
 * (TS2748). O `satisfies` mantém a checagem de tipo — trocar o número por um
 * valor fora do enum quebra o build, não passa despercebido.
 */
const ARGON2ID = 2 satisfies Algorithm;

export const ARGON2_OPTIONS = {
  algorithm: ARGON2ID,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

/**
 * Gera o hash argon2id de uma senha em texto claro.
 *
 * @param plainPassword - Senha em texto claro. Nunca deve ser persistida nem logada.
 * @returns Hash no formato PHC, seguro para armazenar em banco.
 */
export async function hashPassword(plainPassword: string): Promise<string> {
  return hash(plainPassword, ARGON2_OPTIONS);
}

/**
 * Verifica uma senha contra um hash armazenado.
 *
 * Não lança: um hash corrompido ou em formato desconhecido é tratado como
 * "não confere". Propagar a exceção transformaria um registro ruim no banco em
 * erro 500 na tela de login — e, pior, num sinal observável de que aquele
 * usuário existe.
 *
 * @param storedHash - Hash no formato PHC vindo do banco.
 * @param plainPassword - Senha em texto claro informada no login.
 */
export async function verifyPassword(
  storedHash: string,
  plainPassword: string,
): Promise<boolean> {
  try {
    return await verify(storedHash, plainPassword, ARGON2_OPTIONS);
  } catch {
    return false;
  }
}
