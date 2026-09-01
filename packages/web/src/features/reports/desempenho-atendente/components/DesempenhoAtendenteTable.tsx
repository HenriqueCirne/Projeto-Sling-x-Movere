import { formatCurrency } from '@/features/dashboard/format';

import type { DesempenhoAtendenteRow } from '../desempenho-atendente.contract';

type DesempenhoAtendenteTableProps = {
  rows: DesempenhoAtendenteRow[];
};

export function DesempenhoAtendenteTable({ rows }: DesempenhoAtendenteTableProps) {
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
            <th className="px-4 py-3 font-medium">Atendente</th>
            <th className="px-4 py-3 text-right font-medium">Quantidade</th>
            <th className="px-4 py-3 text-right font-medium">Faturamento</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row) => (
            <tr
              key={row.atendente}
              className={row.melhorDesempenho ? 'bg-amber-50 dark:bg-amber-950/20' : undefined}
            >
              <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">
                {row.atendente}
                {row.melhorDesempenho && (
                  <span className="ml-2 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-800 dark:bg-amber-900/50 dark:text-amber-300">
                    Melhor desempenho
                  </span>
                )}
              </td>
              <td className="px-4 py-2 text-right tabular-nums text-zinc-900 dark:text-zinc-50">
                {row.quantidade.toLocaleString('pt-BR')}
              </td>
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
