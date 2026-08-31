import type { Metadata } from 'next';

import { faturamentoPorCondicaoPagamentoService } from '@/features/reports/faturamento-por-condicao-pagamento';
import { FaturamentoPorCondicaoPagamentoTable } from '@/features/reports/faturamento-por-condicao-pagamento/components/FaturamentoPorCondicaoPagamentoTable';
import { ReportFilterForm } from '@/shared/components/ReportFilterForm';
import { parseReportFilterSearchParams } from '@/shared/report-filters/parse-search-params';

export const metadata: Metadata = {
  title: 'Faturamento por Condição de Pagamento — Movimento Gerais',
};

export const dynamic = 'force-dynamic';

/** Faturamento por Condição de Pagamento (Story 2.5). */
export default async function FaturamentoPorCondicaoPagamentoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { filter, valid } = parseReportFilterSearchParams(params);

  const rows = await faturamentoPorCondicaoPagamentoService.getFaturamentoPorCondicao(filter);

  return (
    <main className="flex-1 space-y-6 bg-zinc-50 p-6 dark:bg-zinc-950">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Faturamento por Condição de Pagamento
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Como a rede está recebendo pelas vendas.
        </p>
      </header>

      <ReportFilterForm showLoja />

      {!valid && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          Período inválido — exibindo todos os lançamentos.
        </p>
      )}

      <FaturamentoPorCondicaoPagamentoTable rows={rows} />
    </main>
  );
}
