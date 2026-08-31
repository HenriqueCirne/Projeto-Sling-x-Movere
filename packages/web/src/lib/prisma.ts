import { PrismaClient } from '@prisma/client';

/**
 * Cliente Prisma compartilhado (TD-02: PostgreSQL 16 via `DATABASE_URL`).
 *
 * Duas decisões deliberadas:
 *
 * 1. **Instanciação preguiçosa.** O `PrismaClient` só é construído no primeiro
 *    uso. Construir no carregamento do módulo faria a aplicação inteira quebrar
 *    quando `DATABASE_URL` não estivesse definida — inclusive a própria página
 *    de health-check, que existe justamente para reportar esse estado.
 *
 * 2. **Singleton via `globalThis` fora de produção.** O hot-reload do Next.js
 *    reavalia módulos a cada alteração; sem isso, cada reload abriria um novo
 *    pool de conexões até esgotar os slots do Postgres.
 */

const globalForPrisma = globalThis as unknown as { prismaClient?: PrismaClient };

export function getPrismaClient(): PrismaClient {
  const existing = globalForPrisma.prismaClient;
  if (existing) {
    return existing;
  }

  const client = new PrismaClient({ log: ['warn', 'error'] });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prismaClient = client;
  }

  return client;
}

/**
 * Cliente Prisma em forma de referência estável, resolvido preguiçosamente a
 * cada acesso de propriedade.
 *
 * Existe por causa do `@auth/prisma-adapter` (Story 1.2), que recebe o cliente
 * na CONSTRUÇÃO da configuração do Auth.js — um ponto do módulo em que
 * `getPrismaClient()` ainda não deve ser chamado, sob pena de reintroduzir
 * exatamente a instanciação ansiosa que o comentário acima descarta.
 *
 * O proxy não guarda estado: quem guarda continua sendo `getPrismaClient()`.
 */
export const lazyPrismaClient: PrismaClient = new Proxy({} as PrismaClient, {
  get(_target, property) {
    const client = getPrismaClient();
    // O terceiro argumento (`receiver`) precisa ser o cliente real: os delegates
    // do Prisma (`client.user`, `client.session`, ...) são getters que dependem
    // do `this` correto. Passar o proxy aqui quebraria a resolução.
    return Reflect.get(client, property, client) as unknown;
  },
});
