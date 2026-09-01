import type { PrismaClient } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { buildSalesEntryWhere } from '@/shared/report-filters/sales-entry-where';

export type RawGroup = { atendente: string | null; faturamento: number; quantidade: number };

export interface DesempenhoAtendenteRepository {
  findAgrupadoPorAtendente(filter: ReportFilter): Promise<RawGroup[]>;
}

export class PrismaDesempenhoAtendenteRepository implements DesempenhoAtendenteRepository {
  constructor(private readonly resolveClient: () => PrismaClient = getPrismaClient) {}

  async findAgrupadoPorAtendente(filter: ReportFilter): Promise<RawGroup[]> {
    const prisma = this.resolveClient();

    const groups = await prisma.salesEntry.groupBy({
      by: ['atendente'],
      where: buildSalesEntryWhere(filter),
      _sum: { valorTotal: true, quantidade: true },
      orderBy: { _sum: { valorTotal: 'desc' } },
    });

    return groups.map((g) => ({
      atendente: g.atendente,
      faturamento: g._sum.valorTotal?.toNumber() ?? 0,
      quantidade: g._sum.quantidade?.toNumber() ?? 0,
    }));
  }
}

export const desempenhoAtendenteRepository = new PrismaDesempenhoAtendenteRepository();
