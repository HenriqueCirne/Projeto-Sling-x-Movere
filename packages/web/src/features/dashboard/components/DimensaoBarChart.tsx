// Import direto do módulo (não do barrel `@/features/dashboard`, que também
// reexporta código que arrasta Prisma).
import { formatCurrency } from '@/features/dashboard/format';

import type { DimensaoResumoRow } from '../dashboard.contract';

type DimensaoBarChartProps = {
  titulo: string;
  rows: DimensaoResumoRow[];
};

/**
 * Gráfico de barras horizontais, sem lib de charting (mesma decisão de
 * `FaturamentoPorDataChart`: adicionar uma lib é decisão de arquitetura, não
 * desta story). Server Component — sem interação, diferente do gráfico de
 * Faturamento por Data (que alterna diário/mensal).
 *
 * Barras horizontais (não verticais) porque os rótulos são nomes de negócio
 * (loja, marca, grupo...), não datas — não cabem virados na base de uma
 * barra vertical sem ficar ilegível.
 */
export function DimensaoBarChart({ titulo, rows }: DimensaoBarChartProps) {
  const maiorValor = Math.max(1, ...rows.map((r) => Math.abs(r.faturamento)));

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold text-zinc-900 dark:text-zinc-50">{titulo}</h3>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Nenhum lançamento no período selecionado.
        </p>
      ) : (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.chave} className="flex items-center gap-2 text-xs">
              <span className="w-28 shrink-0 truncate text-zinc-600 dark:text-zinc-400" title={row.chave}>
                {row.chave}
              </span>
              <div className="h-4 flex-1 rounded bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-4 rounded ${row.faturamento >= 0 ? 'bg-zinc-900 dark:bg-zinc-100' : 'bg-red-600 dark:bg-red-400'}`}
                  style={{ width: `${Math.max(2, (Math.abs(row.faturamento) / maiorValor) * 100)}%` }}
                />
              </div>
              <span className="w-24 shrink-0 text-right tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatCurrency(row.faturamento)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
