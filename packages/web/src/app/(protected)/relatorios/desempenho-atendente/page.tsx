import type { Metadata } from 'next';

import { desempenhoAtendenteService } from '@/features/reports/desempenho-atendente';
import { DesempenhoAtendenteTable } from '@/features/reports/desempenho-atendente/components/DesempenhoAtendenteTable';
import { ReportFilterForm } from '@/shared/components/ReportFilterForm';
import { parseReportFilterSearchParams } from '@/shared/report-filters/parse-search-params';

export const metadata: Metadata = {
  title: 'Desempenho por Atendente — Movimento Gerais',
};

export const dynamic = 'force-dynamic';

/** Desempenho por Atendente (Story 3.3). */
export default async function DesempenhoAtendentePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { filter, valid } = parseReportFilterSearchParams(params);

  const rows = await desempenhoAtendenteService.getDesempenho(filter);

  return (
    <main className="flex-1 space-y-6 bg-zinc-50 p-6 dark:bg-zinc-950">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Desempenho por Atendente
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Quantidade e faturamento por atendente.
        </p>
      </header>

      <ReportFilterForm showLoja />

      {!valid && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          Período inválido — exibindo todos os lançamentos.
        </p>
      )}

      <DesempenhoAtendenteTable rows={rows} />
    </main>
  );
}
