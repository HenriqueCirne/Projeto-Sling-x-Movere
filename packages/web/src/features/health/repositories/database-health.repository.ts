import { getPrismaClient } from '@/lib/prisma';

export type DatabasePingResult = {
  reachable: boolean;
  /** Latência da sondagem em ms; `null` quando a conexão falhou. */
  latencyMs: number | null;
};

export interface DatabaseHealthRepository {
  /** Executa uma query trivial para provar que o banco responde. Não lança. */
  ping(): Promise<DatabasePingResult>;
}

export class PrismaDatabaseHealthRepository implements DatabaseHealthRepository {
  async ping(): Promise<DatabasePingResult> {
    const startedAt = Date.now();

    try {
      const prisma = getPrismaClient();
      await prisma.$queryRaw`SELECT 1`;
      return { reachable: true, latencyMs: Date.now() - startedAt };
    } catch (error) {
      // O erro bruto do Prisma pode conter a connection string (com senha).
      // Ele fica no log do servidor e NUNCA sobe para a camada de apresentação.
      console.error('[health] falha ao conectar no banco de dados:', error);
      return { reachable: false, latencyMs: null };
    }
  }
}

export const databaseHealthRepository = new PrismaDatabaseHealthRepository();
