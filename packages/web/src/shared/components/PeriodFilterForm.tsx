'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

/**
 * Filtro de período (data inicial/final), compartilhado entre o Painel
 * (Story 1.5) e os relatórios futuros da Epic 2/3 — "filtros de período e
 * loja aplicáveis a qualquer relatório" é um paradigma-chave do produto
 * [Source: docs/prd/user-interface-design-goals.md#Paradigmas-Chave de Interação].
 *
 * Empurra o filtro para a URL (`?dataInicial=&dataFinal=`) em vez de manter
 * estado local: a página que consome isto é um Server Component que lê
 * `searchParams` — o filtro sobrevive a um reload e é compartilhável por link,
 * sem exigir nenhuma chamada de API cliente-servidor além da navegação.
 */
export function PeriodFilterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dataInicial, setDataInicial] = useState(searchParams.get('dataInicial') ?? '');
  const [dataFinal, setDataFinal] = useState(searchParams.get('dataFinal') ?? '');

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const params = new URLSearchParams();
    if (dataInicial) params.set('dataInicial', dataInicial);
    if (dataFinal) params.set('dataFinal', dataFinal);

    const query = params.toString();
    router.push(query ? `?${query}` : '?');
  };

  const onClear = () => {
    setDataInicial('');
    setDataFinal('');
    router.push('?');
  };

  return (
    <form
      onSubmit={onSubmit}
      className="flex flex-wrap items-end gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="space-y-1">
        <label
          htmlFor="dataInicial"
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          De
        </label>
        <input
          id="dataInicial"
          type="date"
          value={dataInicial}
          onChange={(event) => setDataInicial(event.target.value)}
          max={dataFinal || undefined}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <div className="space-y-1">
        <label
          htmlFor="dataFinal"
          className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
        >
          Até
        </label>
        <input
          id="dataFinal"
          type="date"
          value={dataFinal}
          onChange={(event) => setDataFinal(event.target.value)}
          min={dataInicial || undefined}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
      </div>

      <button
        type="submit"
        className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        Filtrar
      </button>

      {(dataInicial || dataFinal) && (
        <button
          type="button"
          onClick={onClear}
          className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
        >
          Limpar
        </button>
      )}
    </form>
  );
}
