'use client';

import { useMemo, useState } from 'react';

// Import direto do módulo (não do barrel `@/features/dashboard`, que também
// reexporta código que arrasta Prisma) — este é um Client Component.
import { formatCurrency } from '@/features/dashboard/format';

import { sortByFoco, type DimensaoFoco } from '../sort-by-foco';
import type { TipoPrecoLojaItemRow } from '../tipo-preco-loja-item.contract';

type TipoPrecoLojaItemTableProps = {
  rows: TipoPrecoLojaItemRow[];
};

const OPCOES_FOCO: { valor: DimensaoFoco; rotulo: string }[] = [
  { valor: 'tipoPreco', rotulo: 'Tipo de Preço' },
  { valor: 'loja', rotulo: 'Loja' },
  { valor: 'item', rotulo: 'Item' },
];

export function TipoPrecoLojaItemTable({ rows }: TipoPrecoLojaItemTableProps) {
  const [foco, setFoco] = useState<DimensaoFoco>('tipoPreco');

  const sortedRows = useMemo(() => sortByFoco(rows, foco), [rows, foco]);

  if (rows.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Nenhum lançamento no período selecionado.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
          Agrupar por:
        </span>
        {OPCOES_FOCO.map((opcao) => (
          <button
            key={opcao.valor}
            type="button"
            onClick={() => setFoco(opcao.valor)}
            aria-pressed={foco === opcao.valor}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
              foco === opcao.valor
                ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                : 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
            }`}
          >
            {opcao.rotulo}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-zinc-200 text-xs uppercase tracking-wide text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
            <tr>
              <th className="px-4 py-3 font-medium">Tipo de Preço</th>
              <th className="px-4 py-3 font-medium">Loja</th>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 text-right font-medium">Quantidade</th>
              <th className="px-4 py-3 text-right font-medium">Faturamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
            {sortedRows.map((row, index) => (
              <tr key={index}>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.tipoPreco}</td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.loja}</td>
                <td className="px-4 py-2 text-zinc-700 dark:text-zinc-300">{row.item}</td>
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
    </div>
  );
}
