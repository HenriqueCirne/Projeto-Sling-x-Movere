import type { PrismaClient } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';

import type { PeriodFilter } from '../dashboard.contract';

/**
 * Agregados brutos vindos do banco, antes do cálculo de Ticket Médio (que é
 * responsabilidade do `DashboardKpisService`, não deste repositório — a
 * fórmula é regra de negócio, não acesso a dado).
 */
export type DashboardAggregates = {
  faturamentoTotal: number;
  quantidadeTotal: number;
  numeroDeLancamentos: number;
  numeroDeClientesDistintos: number;
};

export interface DashboardKpisRepository {
  getAggregates(period: PeriodFilter): Promise<DashboardAggregates>;
}

export class PrismaDashboardKpisRepository implements DashboardKpisRepository {
  constructor(private readonly resolveClient: () => PrismaClient = getPrismaClient) {}

  async getAggregates(period: PeriodFilter): Promise<DashboardAggregates> {
    const prisma = this.resolveClient();

    const where = {
      ...(period.dataInicial || period.dataFinal
        ? {
            dataEmissao: {
              ...(period.dataInicial ? { gte: period.dataInicial } : {}),
              ...(period.dataFinal ? { lte: period.dataFinal } : {}),
            },
          }
        : {}),
    };

    // Duas idas ao banco, não uma: `aggregate` não faz COUNT(DISTINCT) sobre
    // uma coluna não-agrupada. `$queryRaw` aqui é SQL portável (COUNT DISTINCT
    // é padrão ANSI, não recurso proprietário do Postgres) — não fere o TD-02.
    const [aggregate, distinctClientesResult] = await Promise.all([
      prisma.salesEntry.aggregate({
        where,
        _sum: { valorTotal: true, quantidade: true },
        _count: { _all: true },
      }),
      prisma.$queryRaw<{ count: bigint }[]>`
        SELECT COUNT(DISTINCT cliente) AS count
        FROM sales_entries
        WHERE cliente IS NOT NULL
          AND (${period.dataInicial ?? null}::timestamp IS NULL OR data_emissao >= ${period.dataInicial ?? null})
          AND (${period.dataFinal ?? null}::timestamp IS NULL OR data_emissao <= ${period.dataFinal ?? null})
      `,
    ]);

    return {
      faturamentoTotal: aggregate._sum.valorTotal?.toNumber() ?? 0,
      quantidadeTotal: aggregate._sum.quantidade?.toNumber() ?? 0,
      numeroDeLancamentos: aggregate._count._all,
      numeroDeClientesDistintos: Number(distinctClientesResult[0]?.count ?? 0),
    };
  }
}

export const dashboardKpisRepository = new PrismaDashboardKpisRepository();
