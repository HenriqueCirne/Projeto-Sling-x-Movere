import type { Prisma } from '@prisma/client';

import type { ReportFilter } from './report-filter.contract';

/**
 * Constrói a cláusula `where` de `sales_entries` a partir do filtro
 * compartilhado (período + loja) — usado por todos os repositórios de
 * relatório (Painel, Epic 2, Epic 3) para não repetir esta lógica em cada
 * feature.
 */
export function buildSalesEntryWhere(filter: ReportFilter): Prisma.SalesEntryWhereInput {
  return {
    ...(filter.dataInicial || filter.dataFinal
      ? {
          dataEmissao: {
            ...(filter.dataInicial ? { gte: filter.dataInicial } : {}),
            ...(filter.dataFinal ? { lte: filter.dataFinal } : {}),
          },
        }
      : {}),
    ...(filter.loja ? { loja: filter.loja } : {}),
  };
}
