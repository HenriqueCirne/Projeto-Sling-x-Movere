import { PrismaClient } from '@prisma/client';

import {
  SeedConfigurationError,
  seedAdminUser,
} from '../packages/web/src/features/auth/services/seed-admin.service';

/**
 * Provisionamento do gestor inicial (Story 1.2, AC5).
 *
 * Uso:
 *   1. defina `SEED_ADMIN_EMAIL` e `SEED_ADMIN_PASSWORD` no `.env` da raiz;
 *   2. `npm run db:up && npm run db:deploy`;
 *   3. `npm run db:seed`.
 *
 * Não existe rota de cadastro público (NFR3): este script é o ÚNICO caminho
 * para criar um gestor. É idempotente — rodar de novo não altera quem já existe.
 *
 * A lógica mora em `seed-admin.service.ts` (dentro de `packages/web`) e não
 * aqui: assim ela é coberta pelo Vitest e usa exatamente os mesmos parâmetros de
 * argon2 que o login usa para verificar. Um seed com hashing próprio geraria
 * senhas que a aplicação não consegue validar.
 */
async function main(): Promise<void> {
  const prisma = new PrismaClient();

  try {
    const outcome = await seedAdminUser(prisma.user, process.env);

    if (outcome.status === 'created') {
      console.log(`[seed] gestor inicial criado: ${outcome.email}`);
    } else {
      console.log(`[seed] gestor ${outcome.email} já existe — nada foi alterado.`);
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error instanceof SeedConfigurationError) {
    // Erro de configuração é do operador, não um defeito: mensagem limpa, sem
    // stack trace (que poderia arrastar valores de ambiente para o log).
    console.error(`[seed] ${error.message}`);
  } else {
    console.error('[seed] falha ao provisionar o gestor inicial:', error);
  }
  process.exitCode = 1;
});
