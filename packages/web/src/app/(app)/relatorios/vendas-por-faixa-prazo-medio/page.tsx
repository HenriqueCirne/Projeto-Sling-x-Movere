import type { Metadata } from 'next';

import { vendasPorFaixaPrazoMedioService } from '@/features/reports/vendas-por-faixa-prazo-medio';
import { VendasPorFaixaPrazoMedioTable } from '@/features/reports/vendas-por-faixa-prazo-medio/components/VendasPorFaixaPrazoMedioTable';
import { ReportFilterForm } from '@/shared/components/ReportFilterForm';
import { parseReportFilterSearchParams } from '@/shared/report-filters/parse-search-params';

export const metadata: Metadata = {
  title: 'Vendas por Faixa de Prazo Médio — Movimento Gerais',
};

export const dynamic = 'force-dynamic';

/** Vendas por Faixa de Prazo Médio (Story 2.4, FR5). */
export default async function VendasPorFaixaPrazoMedioPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { filter, valid } = parseReportFilterSearchParams(params);

  const rows = await vendasPorFaixaPrazoMedioService.getVendasPorFaixa(filter);

  return (
    <main className="flex-1 space-y-6 bg-zinc-50 p-6 dark:bg-zinc-950">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Vendas por Faixa de Prazo Médio
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Perfil de risco/prazo das vendas, por faixa de dias até o recebimento.
        </p>
      </header>

      <ReportFilterForm />

      {!valid && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          Período inválido — exibindo todos os lançamentos.
        </p>
      )}

      <VendasPorFaixaPrazoMedioTable rows={rows} />
    </main>
  );
}
