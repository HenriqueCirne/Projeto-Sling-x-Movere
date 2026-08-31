'use client';

import { useMemo, useState } from 'react';

import { formatCurrency } from '@/features/dashboard';

import type { DailyRevenuePoint } from '../faturamento-por-data.contract';
import { groupByMonth } from '../group-by-month';

type FaturamentoPorDataChartProps = {
  serieDiaria: DailyRevenuePoint[];
};

/**
 * Gráfico de barras dependência-livre (sem lib de charting instalada no
 * projeto — decisão de escopo desta story: adicionar uma lib de gráficos é
 * decisão de arquitetura/design que cabe ao @architect/@ux-design-expert
 * quando houver dado real para desenhar contra). Alternância diário/mensal
 * é só reagrupamento client-side dos mesmos pontos (AC2), sem novo request.
 */
export function FaturamentoPorDataChart({ serieDiaria }: FaturamentoPorDataChartProps) {
  const [visao, setVisao] = useState<'diario' | 'mensal'>('diario');

  const pontos = useMemo(() => {
    if (visao === 'diario') {
      return serieDiaria.map((p) => ({ chave: p.data, valor: p.faturamento }));
    }
    return groupByMonth(serieDiaria).map((p) => ({ chave: p.mes, valor: p.faturamento }));
  }, [serieDiaria, visao]);

  const maiorValor = Math.max(1, ...pontos.map((p) => Math.abs(p.valor)));

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setVisao('diario')}
          aria-pressed={visao === 'diario'}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            visao === 'diario'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
          }`}
        >
          Diário
        </button>
        <button
          type="button"
          onClick={() => setVisao('mensal')}
          aria-pressed={visao === 'mensal'}
          className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
            visao === 'mensal'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
          }`}
        >
          Mensal
        </button>
      </div>

      {pontos.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Nenhum lançamento no período selecionado.
        </p>
      ) : (
        <div className="flex h-48 items-end gap-1 overflow-x-auto rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          {pontos.map((ponto) => (
            <div
              key={ponto.chave}
              className="flex min-w-[2rem] flex-1 flex-col items-center justify-end gap-1"
              title={`${ponto.chave}: ${formatCurrency(ponto.valor)}`}
            >
              <div
                className={`w-full rounded-t ${ponto.valor >= 0 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-red-600 dark:bg-red-400'}`}
                style={{ height: `${Math.max(2, (Math.abs(ponto.valor) / maiorValor) * 100)}%` }}
              />
              <span className="rotate-45 whitespace-nowrap text-[10px] text-zinc-500 dark:text-zinc-400">
                {ponto.chave}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
