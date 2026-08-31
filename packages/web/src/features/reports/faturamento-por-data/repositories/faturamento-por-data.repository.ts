import type { PrismaClient } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { buildSalesEntryWhere } from '@/shared/report-filters/sales-entry-where';

export type RawEntry = { dataEmissao: Date; valorTotal: number };

export interface FaturamentoPorDataRepository {
  /**
   * Linhas brutas (só as 2 colunas necessárias) para o serviço agregar por
   * dia/mês. Deliberadamente NÃO agrega no banco via `DATE_TRUNC` (SQL cru
   * não testável sem Docker — mesmo ADR da 1.5): o volume por período
   * filtrado (índice `dataEmissao` da Story 1.3) é pequeno o bastante para
   * agregar em memória com segurança (NFR2).
   */
  findRawEntries(filter: ReportFilter): Promise<RawEntry[]>;
}

export class PrismaFaturamentoPorDataRepository implements FaturamentoPorDataRepository {
  constructor(private readonly resolveClient: () => PrismaClient = getPrismaClient) {}

  async findRawEntries(filter: ReportFilter): Promise<RawEntry[]> {
    const prisma = this.resolveClient();

    const rows = await prisma.salesEntry.findMany({
      where: buildSalesEntryWhere(filter),
      select: { dataEmissao: true, valorTotal: true },
    });

    return rows.map((row) => ({
      dataEmissao: row.dataEmissao,
      valorTotal: row.valorTotal.toNumber(),
    }));
  }
}

export const faturamentoPorDataRepository = new PrismaFaturamentoPorDataRepository();
