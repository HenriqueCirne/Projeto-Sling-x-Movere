import { formatCurrency } from '@/features/dashboard';

import type { RankingClientesRow } from '../ranking-clientes.contract';

type RankingClientesTableProps = {
  rows: RankingClientesRow[];
};

export function RankingClientesTable({ rows }: RankingClientesTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Nenhum cliente identificado no período selecionado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">#</th>
            <th className="px-4 py-3 font-medium">Cliente</th>
            <th className="px-4 py-3 text-right font-medium">Faturamento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.cliente}>
              <td className="px-4 py-2 tabular-nums text-zinc-500 dark:text-zinc-400">
                {row.posicao}
              </td>
              <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.cliente}</td>
              <td className="px-4 py-2 text-right tabular-nums text-zinc-900 dark:text-zinc-50">
                {formatCurrency(row.faturamento)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
