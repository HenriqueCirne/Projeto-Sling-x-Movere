import { formatCurrency } from '@/features/dashboard/format';

import type { VendasPorItemResumoRow } from '../vendas-por-item.contract';

type VendasPorItemResumoTableProps = {
  titulo: string;
  colunaChave: string;
  rows: VendasPorItemResumoRow[];
};

/**
 * Tabela de resumo (por Grupo ou por Loja, sem o detalhe de Item/Marca/Tipo
 * de Preço) — pedido direto do usuário: "tenho como ver o resumo por cada
 * grupo e resumido por loja", depois de Linha/Marca/Tipo de Preço deixarem a
 * tabela detalhada mais granular.
 */
export function VendasPorItemResumoTable({
  titulo,
  colunaChave,
  rows,
}: VendasPorItemResumoTableProps) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{titulo}</h2>

      {rows.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Nenhum lançamento no período selecionado.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">{colunaChave}</th>
                <th className="px-4 py-3 text-right font-medium">Quantidade</th>
                <th className="px-4 py-3 text-right font-medium">Faturamento</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {rows.map((row) => (
                <tr key={row.chave}>
                  <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.chave}</td>
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
      )}
    </section>
  );
}
