import type { Metadata } from 'next';

import { tipoPrecoLojaItemService } from '@/features/reports/tipo-preco-loja-item';
import { TipoPrecoLojaItemTable } from '@/features/reports/tipo-preco-loja-item/components/TipoPrecoLojaItemTable';
import { ReportFilterForm } from '@/shared/components/ReportFilterForm';
import { parseReportFilterSearchParams } from '@/shared/report-filters/parse-search-params';

export const metadata: Metadata = {
  title: 'Tipo de Preço × Loja × Item — Movimento Gerais',
};

export const dynamic = 'force-dynamic';

/** Tipo de Preço × Loja × Item (Story 3.2). */
export default async function TipoPrecoLojaItemPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { filter, valid } = parseReportFilterSearchParams(params);

  const rows = await tipoPrecoLojaItemService.getCruzamento(filter);

  return (
    <main className="flex-1 space-y-6 bg-zinc-50 p-6 dark:bg-zinc-950">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Tipo de Preço × Loja × Item
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Política de preços praticada.
        </p>
      </header>

      <ReportFilterForm showLoja />

      {!valid && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          Período inválido — exibindo todos os lançamentos.
        </p>
      )}

      <TipoPrecoLojaItemTable rows={rows} />
    </main>
  );
}
