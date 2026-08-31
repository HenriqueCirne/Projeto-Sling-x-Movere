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
    // uma coluna não-agrupada. `groupBy` (não `$queryRaw`) porque o GROUP BY
    // ainda roda no Postgres — só o resultado (uma linha por cliente distinto,
    // ~5 mil linhas no volume de referência do TD-04) volta para o Node, não
    // a tabela inteira. Deliberadamente NÃO usei SQL cru aqui: sem Docker
    // nesta máquina, um `$queryRaw` com bind de parâmetros errado só
    // quebraria quando a Story 1.4 gravasse dado real — `groupBy` é
    // type-safe e usa o mesmo query builder já exercitado pelo `aggregate`
    // acima.
    const [aggregate, distinctClientesGroups] = await Promise.all([
      prisma.salesEntry.aggregate({
        where,
        _sum: { valorTotal: true, quantidade: true },
        _count: { _all: true },
      }),
      prisma.salesEntry.groupBy({
        by: ['cliente'],
        where: { ...where, cliente: { not: null } },
      }),
    ]);

    return {
      faturamentoTotal: aggregate._sum.valorTotal?.toNumber() ?? 0,
      quantidadeTotal: aggregate._sum.quantidade?.toNumber() ?? 0,
      numeroDeLancamentos: aggregate._count._all,
      numeroDeClientesDistintos: distinctClientesGroups.length,
    };
  }
}

export const dashboardKpisRepository = new PrismaDashboardKpisRepository();
