import type { Metadata } from 'next';

import { vendasPorItemService } from '@/features/reports/vendas-por-item';
import { VendasPorItemResumoTable } from '@/features/reports/vendas-por-item/components/VendasPorItemResumoTable';
import { VendasPorItemTable } from '@/features/reports/vendas-por-item/components/VendasPorItemTable';
import { ReportFilterForm } from '@/shared/components/ReportFilterForm';
import { parseReportFilterSearchParams } from '@/shared/report-filters/parse-search-params';

export const metadata: Metadata = {
  title: 'Vendas por Item — Movimento Gerais',
};

export const dynamic = 'force-dynamic';

/** Vendas por Item — Família/Grupo/Item (Story 2.2). */
export default async function VendasPorItemPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { filter, valid } = parseReportFilterSearchParams(params);

  const [rows, resumoPorLoja, resumoPorGrupo, opcoes] = await Promise.all([
    vendasPorItemService.getPorItem(filter),
    vendasPorItemService.getResumoPorLoja(filter),
    vendasPorItemService.getResumoPorGrupo(filter),
    vendasPorItemService.getOpcoesDeFiltro(),
  ]);

  return (
    <main className="flex-1 space-y-6 bg-zinc-50 p-6 dark:bg-zinc-950">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Vendas por Item
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Quantidade vendida agrupada por Família, Grupo e Item.
        </p>
      </header>

      <ReportFilterForm
        extraFilters={[
          { key: 'linha', label: 'Linha', options: opcoes.linhas },
          { key: 'familia', label: 'Família', options: opcoes.familias },
          { key: 'grupo', label: 'Grupo', options: opcoes.grupos },
          { key: 'marca', label: 'Marca', options: opcoes.marcas },
          { key: 'tipoPreco', label: 'Tipo de Preço', options: opcoes.tiposPreco },
        ]}
      />

      {!valid && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          Período inválido — exibindo todos os lançamentos.
        </p>
      )}

      <VendasPorItemResumoTable titulo="Resumo por Loja" colunaChave="Loja" rows={resumoPorLoja} />
      <VendasPorItemResumoTable titulo="Resumo por Grupo" colunaChave="Grupo" rows={resumoPorGrupo} />

      <section className="space-y-2">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Detalhe completo</h2>
        <VendasPorItemTable rows={rows} />
      </section>
    </main>
  );
}
