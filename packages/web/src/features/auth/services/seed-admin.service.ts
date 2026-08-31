import { normalizeEmail, seedAdminSchema } from '../schemas/credentials.schema';
import { hashPassword } from './password.service';

/**
 * Provisionamento do gestor inicial (AC5).
 *
 * ⚠️ Módulo compartilhado com `prisma/seed.ts`: só pode importar de
 * `node_modules` ou por caminho relativo — nada de alias `@/...`, nada de
 * `next/*`. A lógica vive aqui (e não dentro do script) para poder ser testada
 * pelo Vitest; `prisma/seed.ts` fica sendo apenas o ponto de entrada de CLI.
 */

/** Fatia do `PrismaClient` de que o seed precisa — permite teste sem banco. */
export type SeedUserStore = {
  findUnique(args: { where: { email: string } }): Promise<{ id: string } | null>;
  create(args: {
    data: { email: string; name: string | null; passwordHash: string };
  }): Promise<{ id: string }>;
};

export type SeedAdminEnv = {
  SEED_ADMIN_EMAIL?: string | undefined;
  SEED_ADMIN_PASSWORD?: string | undefined;
  SEED_ADMIN_NAME?: string | undefined;
};

export type SeedAdminOutcome =
  | { status: 'created'; email: string; userId: string }
  | { status: 'already_exists'; email: string; userId: string };

/** Erro de configuração do seed — mensagem segura para exibir no terminal. */
export class SeedConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SeedConfigurationError';
  }
}

/**
 * Cria o gestor inicial se ele ainda não existir.
 *
 * **Idempotente por omissão deliberada:** quando o e-mail já existe, o registro
 * não é tocado. Sobrescrever a senha a cada execução transformaria o seed em uma
 * arma — um `npm run db:seed` acidental em produção reverteria silenciosamente a
 * senha que o gestor trocou de volta para o valor da variável de ambiente.
 *
 * @param users - Delegate `prisma.user` (ou equivalente em teste).
 * @param env - Fonte das variáveis de ambiente.
 * @param hash - Função de hashing; injetável para manter o teste rápido.
 * @throws {SeedConfigurationError} Quando as variáveis exigidas faltam ou são inválidas.
 */
export async function seedAdminUser(
  users: SeedUserStore,
  env: SeedAdminEnv,
  hash: (plainPassword: string) => Promise<string> = hashPassword,
): Promise<SeedAdminOutcome> {
  const parsed = seedAdminSchema.safeParse({
    email: env.SEED_ADMIN_EMAIL,
    password: env.SEED_ADMIN_PASSWORD,
    name: env.SEED_ADMIN_NAME,
  });

  if (!parsed.success) {
    // Só as mensagens são propagadas — nunca os valores recebidos, que
    // incluiriam a senha em texto claro no stderr e no log do CI.
    const reasons = parsed.error.issues.map((issue) => issue.message).join(' ');
    throw new SeedConfigurationError(
      `Não foi possível provisionar o gestor inicial. ${reasons}`,
    );
  }

  const email = normalizeEmail(parsed.data.email);
  const existing = await users.findUnique({ where: { email } });

  if (existing) {
    return { status: 'already_exists', email, userId: existing.id };
  }

  const created = await users.create({
    data: {
      email,
      name: parsed.data.name ?? null,
      passwordHash: await hash(parsed.data.password),
    },
  });

  return { status: 'created', email, userId: created.id };
}
