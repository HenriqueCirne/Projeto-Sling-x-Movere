import type { PrismaClient } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { buildSalesEntryWhere } from '@/shared/report-filters/sales-entry-where';

export type RawGroup = { condicaoPagamento: string | null; faturamento: number };

export interface FaturamentoPorCondicaoPagamentoRepository {
  findAgrupadoPorCondicao(filter: ReportFilter): Promise<RawGroup[]>;
}

export class PrismaFaturamentoPorCondicaoPagamentoRepository
  implements FaturamentoPorCondicaoPagamentoRepository
{
  constructor(private readonly resolveClient: () => PrismaClient = getPrismaClient) {}

  async findAgrupadoPorCondicao(filter: ReportFilter): Promise<RawGroup[]> {
    const prisma = this.resolveClient();

    const groups = await prisma.salesEntry.groupBy({
      by: ['condicaoPagamento'],
      where: buildSalesEntryWhere(filter),
      _sum: { valorTotal: true },
      orderBy: { _sum: { valorTotal: 'desc' } },
    });

    return groups.map((g) => ({
      condicaoPagamento: g.condicaoPagamento,
      faturamento: g._sum.valorTotal?.toNumber() ?? 0,
    }));
  }
}

export const faturamentoPorCondicaoPagamentoRepository =
  new PrismaFaturamentoPorCondicaoPagamentoRepository();
