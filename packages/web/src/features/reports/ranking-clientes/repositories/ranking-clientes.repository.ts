import type { PrismaClient } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { buildSalesEntryWhere } from '@/shared/report-filters/sales-entry-where';

export type RawGroup = { cliente: string; faturamento: number };

export interface RankingClientesRepository {
  /** Já exclui `cliente: null` — ver contrato. */
  findAgrupadoPorCliente(filter: ReportFilter): Promise<RawGroup[]>;
}

export class PrismaRankingClientesRepository implements RankingClientesRepository {
  constructor(private readonly resolveClient: () => PrismaClient = getPrismaClient) {}

  async findAgrupadoPorCliente(filter: ReportFilter): Promise<RawGroup[]> {
    const prisma = this.resolveClient();

    const groups = await prisma.salesEntry.groupBy({
      by: ['cliente'],
      where: { ...buildSalesEntryWhere(filter), cliente: { not: null } },
      _sum: { valorTotal: true },
      orderBy: { _sum: { valorTotal: 'desc' } },
    });

    return groups
      .filter((g): g is typeof g & { cliente: string } => g.cliente !== null)
      .map((g) => ({ cliente: g.cliente, faturamento: g._sum.valorTotal?.toNumber() ?? 0 }));
  }
}

export const rankingClientesRepository = new PrismaRankingClientesRepository();
