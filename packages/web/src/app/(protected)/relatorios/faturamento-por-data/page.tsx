import type { Metadata } from 'next';

import { faturamentoPorDataService } from '@/features/reports/faturamento-por-data';
import { FaturamentoPorDataChart } from '@/features/reports/faturamento-por-data/components/FaturamentoPorDataChart';
import { ReportFilterForm } from '@/shared/components/ReportFilterForm';
import { parseReportFilterSearchParams } from '@/shared/report-filters/parse-search-params';

export const metadata: Metadata = {
  title: 'Faturamento por Data — Movimento Gerais',
};

export const dynamic = 'force-dynamic';

/**
 * Faturamento por Data (Story 2.1, AC1–AC3). AC4 (paridade com a planilha)
 * não é verificável nesta sessão — `sales_entries` está vazia até a Story
 * 1.4 desbloquear (ver `docs/architecture/api-moveres-contract-spike.md`).
 */
export default async function FaturamentoPorDataPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { filter, valid } = parseReportFilterSearchParams(params);

  const serie = await faturamentoPorDataService.getSerieDiaria(filter);

  return (
    <main className="flex-1 space-y-6 bg-zinc-50 p-6 dark:bg-zinc-950">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Faturamento por Data
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Evolução do faturamento ao longo do tempo.
        </p>
      </header>

      <ReportFilterForm showLoja />

      {!valid && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          Período inválido — exibindo todos os lançamentos.
        </p>
      )}

      <FaturamentoPorDataChart serieDiaria={serie} />
    </main>
  );
}
