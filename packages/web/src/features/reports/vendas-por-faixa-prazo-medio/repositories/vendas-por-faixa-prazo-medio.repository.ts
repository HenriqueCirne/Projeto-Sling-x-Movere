import type { PrismaClient } from '@prisma/client';

import { getPrismaClient } from '@/lib/prisma';
import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';
import { buildSalesEntryWhere } from '@/shared/report-filters/sales-entry-where';

export type RawEntry = { prazoMedio: number; valorTotal: number };

export interface VendasPorFaixaPrazoMedioRepository {
  /**
   * Linhas brutas (só as 2 colunas necessárias) para o serviço agrupar por
   * faixa de Prazo Médio. Deliberadamente NÃO agrupa no banco: a faixa é uma
   * dimensão derivada (não uma coluna), então agregar em memória (mesmo
   * padrão de `faturamento-por-data`) é mais simples que um `CASE WHEN` em
   * SQL cru não testável sem Docker — o volume por período filtrado é
   * pequeno o bastante para isso (NFR2).
   */
  findRawEntries(filter: ReportFilter): Promise<RawEntry[]>;
}

export class PrismaVendasPorFaixaPrazoMedioRepository
  implements VendasPorFaixaPrazoMedioRepository
{
  constructor(private readonly resolveClient: () => PrismaClient = getPrismaClient) {}

  async findRawEntries(filter: ReportFilter): Promise<RawEntry[]> {
    const prisma = this.resolveClient();

    const rows = await prisma.salesEntry.findMany({
      where: buildSalesEntryWhere(filter),
      select: { prazoMedio: true, valorTotal: true },
    });

    return rows.map((row) => ({
      prazoMedio: row.prazoMedio.toNumber(),
      valorTotal: row.valorTotal.toNumber(),
    }));
  }
}

export const vendasPorFaixaPrazoMedioRepository = new PrismaVendasPorFaixaPrazoMedioRepository();
