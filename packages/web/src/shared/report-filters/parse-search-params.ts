import { reportFilterInputSchema, toReportFilter } from './report-filter.schema';
import type { ReportFilter } from './report-filter.contract';

type SearchParams = Record<string, string | string[] | undefined>;

/**
 * Extrai e valida o filtro compartilhado (`dataInicial`/`dataFinal`/`loja`)
 * dos `searchParams` de uma página Server Component. Usado por todas as
 * páginas de relatório para não repetir o mesmo parse/validate/degrade em
 * cada uma.
 *
 * Filtro inválido (ex: URL editada à mão com datas invertidas) degrada para
 * "sem filtro" em vez de quebrar a página — mesma filosofia do health-check
 * da Story 1.1 (degradar, não derrubar).
 */
export function parseReportFilterSearchParams(params: SearchParams): {
  filter: ReportFilter;
  valid: boolean;
} {
  const parsed = reportFilterInputSchema.safeParse({
    dataInicial: typeof params.dataInicial === 'string' ? params.dataInicial : undefined,
    dataFinal: typeof params.dataFinal === 'string' ? params.dataFinal : undefined,
    loja: typeof params.loja === 'string' ? params.loja : undefined,
  });

  return {
    filter: parsed.success ? toReportFilter(parsed.data) : {},
    valid: parsed.success,
  };
}
