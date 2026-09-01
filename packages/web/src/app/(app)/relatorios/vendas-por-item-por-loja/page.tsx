import type { Metadata } from 'next';

import { vendasPorItemService } from '@/features/reports/vendas-por-item';
import { VendasPorItemTable } from '@/features/reports/vendas-por-item/components/VendasPorItemTable';
import { ReportFilterForm } from '@/shared/components/ReportFilterForm';
import { parseReportFilterSearchParams } from '@/shared/report-filters/parse-search-params';

export const metadata: Metadata = {
  title: 'Vendas por Item por Loja — Movimento Gerais',
};

export const dynamic = 'force-dynamic';

/** Vendas por Item aberto por Loja (Story 2.3) — reaproveita a tabela da 2.2. */
export default async function VendasPorItemPorLojaPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { filter, valid } = parseReportFilterSearchParams(params);

  const rows = await vendasPorItemService.getPorItemPorLoja(filter);

  return (
    <main className="flex-1 space-y-6 bg-zinc-50 p-6 dark:bg-zinc-950">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Vendas por Item por Loja
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Compare o desempenho de produtos entre lojas.
        </p>
      </header>

      <ReportFilterForm />

      {!valid && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          Período inválido — exibindo todos os lançamentos.
        </p>
      )}

      <VendasPorItemTable rows={rows} />
    </main>
  );
}
