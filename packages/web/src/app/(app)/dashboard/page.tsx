import type { Metadata } from 'next';

import { KpiCard } from '@/shared/components/KpiCard';
import { formatCurrency, formatInteger } from '@/features/dashboard';
import { DimensaoBarChart } from '@/features/dashboard/components/DimensaoBarChart';
import { dashboardKpisService } from '@/features/dashboard/services/dashboard-kpis.service';
import { dashboardResumosService } from '@/features/dashboard/services/dashboard-resumos.service';
import { parseReportFilterSearchParams } from '@/shared/report-filters/parse-search-params';
import { ReportFilterForm } from '@/shared/components/ReportFilterForm';

export const metadata: Metadata = {
  title: 'Painel — Movimento Gerais',
};

export const dynamic = 'force-dynamic';

/**
 * Painel — KPIs de resumo (Story 1.5, AC1/AC2).
 *
 * A autenticação (AC3) já está garantida por `app/(protected)/layout.tsx`,
 * que envolve esta página — não há checagem de sessão aqui de propósito,
 * para não reimplementar o que a Story 1.2 já resolveu.
 *
 * **AC4 (dados vêm da tabela sincronizada) não é verificável nesta sessão de
 * trabalho:** a Story 1.4 está bloqueada por uma questão de permissão na
 * conta da API Moveres (ver `docs/architecture/api-moveres-contract-spike.md`).
 * Esta página consulta `sales_entries` normalmente — funciona corretamente
 * hoje com 0 linhas (mostra zeros) e passará a mostrar dados reais assim que
 * o job da 1.4 gravar algo, sem nenhuma mudança de código.
 */
export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const { filter, valid } = parseReportFilterSearchParams(params);

  const [kpis, resumos] = await Promise.all([
    dashboardKpisService.getKpis(filter),
    dashboardResumosService.getResumosPorDimensao(filter),
  ]);

  return (
    <main className="flex-1 space-y-6 bg-zinc-50 p-6 dark:bg-zinc-950">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Painel
        </h1>
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          Resumo do desempenho comercial.
        </p>
      </header>

      <ReportFilterForm />

      {!valid && (
        <p role="alert" className="text-sm text-red-700 dark:text-red-300">
          Período inválido — exibindo todos os lançamentos.
        </p>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Faturamento Total" value={formatCurrency(kpis.faturamentoTotal)} />
        <KpiCard label="Quantidade Total" value={formatInteger(kpis.quantidadeTotal)} />
        <KpiCard label="Nº de Lançamentos" value={formatInteger(kpis.numeroDeLancamentos)} />
        <KpiCard label="Ticket Médio" value={formatCurrency(kpis.ticketMedio)} />
        <KpiCard label="Nº de Clientes" value={formatInteger(kpis.numeroDeClientes)} />
      </div>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
          Faturamento por dimensão
        </h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Mesmos indicadores disponíveis como filtro em Vendas por Item — as 8 maiores por
          faturamento em cada um.
        </p>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2 xl:grid-cols-3">
          <DimensaoBarChart titulo="Loja" rows={resumos.loja} />
          <DimensaoBarChart titulo="Linha" rows={resumos.linha} />
          <DimensaoBarChart titulo="Família" rows={resumos.familia} />
          <DimensaoBarChart titulo="Grupo" rows={resumos.grupo} />
          <DimensaoBarChart titulo="Marca" rows={resumos.marca} />
          <DimensaoBarChart titulo="Tipo de Preço" rows={resumos.tipoPreco} />
        </div>
      </section>
    </main>
  );
}
