import type { Metadata } from 'next';

import { rankingClientesService } from '@/features/reports/ranking-clientes';
import { RankingClientesTable } from '@/features/reports/ranking-clientes/components/RankingClientesTable';
import { ReportFilterForm } from '@/shared/components/ReportFilterForm';
import { parseReportFilterSearchParams } from '@/shared/report-filters/parse-search-params';

export const metadata: Metadata = {
  title: 'Ranking de Clientes — Movimento Gerais',
};

export const dynamic = 'force-dynamic';

/** Ranking de Clientes por Faturamento (Story 3.1). */
export default async function RankingClientesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { filter, valid } = parseReportFilterSearchParams(params);

  const rows = await rankingClientesService.getRanking(filter);

  return (
    <main className="flex-1 space-y-6 bg-zinc-50 p-6 dark:bg-zinc-950">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Ranking de Clientes
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Clientes mais valiosos por faturamento total.
        </p>
      </header>

      <ReportFilterForm />

      {!valid && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          Período inválido — exibindo todos os lançamentos.
        </p>
      )}

      <RankingClientesTable rows={rows} />
    </main>
  );
}
