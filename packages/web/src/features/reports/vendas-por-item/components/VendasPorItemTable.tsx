import type { VendasPorItemPorLojaRow, VendasPorItemRow } from '../vendas-por-item.contract';

type VendasPorItemTableProps = {
  rows: VendasPorItemRow[] | VendasPorItemPorLojaRow[];
};

function hasLoja(rows: VendasPorItemRow[] | VendasPorItemPorLojaRow[]): rows is VendasPorItemPorLojaRow[] {
  return rows.length > 0 && 'loja' in rows[0]!;
}

/**
 * Tabela compartilhada entre a Story 2.2 (sem Loja) e a Story 2.3 (com
 * Loja) — mesma visão, dimensão extra opcional (Task 2 da 2.3: reaproveitar,
 * não recriar).
 */
export function VendasPorItemTable({ rows }: VendasPorItemTableProps) {
  const showLoja = hasLoja(rows);

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
            {showLoja && <th className="px-4 py-3 font-medium">Loja</th>}
            <th className="px-4 py-3 font-medium">Família</th>
            <th className="px-4 py-3 font-medium">Grupo</th>
            <th className="px-4 py-3 font-medium">Item</th>
            <th className="px-4 py-3 text-right font-medium">Quantidade</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
          {rows.map((row, index) => (
            // Linhas de agregação não têm id próprio; a posição já é estável
            // (resultado de uma query ordenada, não reordenado no cliente).
            <tr key={index}>
              {showLoja && 'loja' in row && (
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.loja}</td>
              )}
              <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.familia}</td>
              <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.grupo}</td>
              <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.item}</td>
              <td className="px-4 py-2 text-right tabular-nums text-zinc-900 dark:text-zinc-50">
                {row.quantidade.toLocaleString('pt-BR')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
