import { formatCurrency } from '@/features/dashboard';

import type { VendasPorFaixaPrazoMedioRow } from '../vendas-por-faixa-prazo-medio.contract';

type VendasPorFaixaPrazoMedioTableProps = {
  rows: VendasPorFaixaPrazoMedioRow[];
};

export function VendasPorFaixaPrazoMedioTable({ rows }: VendasPorFaixaPrazoMedioTableProps) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Nenhum lançamento no período selecionado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <tr>
            <th className="px-4 py-3 font-medium">Faixa de Prazo Médio</th>
            <th className="px-4 py-3 text-right font-medium">Faturamento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => (
            <tr key={row.faixa}>
              <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.faixa}</td>
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
