import { z } from 'zod';

/**
 * Variáveis de ambiente da aplicação, validadas com Zod na fronteira do sistema.
 *
 * Fonte única de verdade: o `.env` da raiz do monorepo (mesmo arquivo já usado
 * pelas variáveis `MOVERE_API_*` e pelo `docker-compose.yml`). O carregamento é
 * feito por `@next/env` em `next.config.ts` — ver comentários lá.
 *
 * `DATABASE_URL` é declarada como opcional de propósito: a ausência dela é uma
 * condição de saúde legítima e reportável (health-check exibe `not_configured`),
 * não um crash na inicialização do processo.
 */

/** Trata string vazia (`VAR=` no `.env`) como ausente, e não como valor válido. */
const optionalEnvString = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() === '' ? undefined : value),
  z.string().min(1).optional(),
);

export const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  DATABASE_URL: optionalEnvString,
});

export type Env = z.infer<typeof envSchema>;

/** Fonte de variáveis de ambiente — `process.env` é atribuível a este tipo. */
export type EnvSource = Record<string, string | undefined>;

/**
 * Valida e retorna as variáveis de ambiente.
 *
 * @param source - Fonte das variáveis (default: `process.env`). Parametrizado
 *   para permitir teste sem mutar o ambiente global do processo.
 * @throws {z.ZodError} Quando alguma variável presente tem valor inválido.
 */
export function parseEnv(source: EnvSource = process.env): Env {
  return envSchema.parse({
    NODE_ENV: source.NODE_ENV,
    DATABASE_URL: source.DATABASE_URL,
  });
}
