'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, type FormEvent } from 'react';

/** Um filtro extra em formato de seletor (ex: Marca, Grupo, Tipo de Preço). */
export type ExtraSelectFilter = {
  /** Nome do parâmetro na URL (`?marca=`, `?tipoPreco=`, ...) — bate com `ReportFilter`. */
  key: string;
  label: string;
  /** Valores distintos existentes no período/dado atual (Story 2.2, filtro de item). */
  options: readonly string[];
};

type ReportFilterFormProps = {
  /** Mostra os campos De/Até (padrão: sim). `false` para uma instância que só cuida dos seletores extras — ver `layout="vertical"`, usado na barra lateral do Vendas por Item. */
  showPeriod?: boolean;
  /**
   * Mostra o campo de loja (texto livre — não há catálogo de lojas
   * sincronizado na aplicação; `SalesEntry.loja` é `String?` livre, Story
   * 1.3). Só as stories cuja AC pede filtro por loja habilitam isto
   * (2.1, 2.5, 3.3) — os demais relatórios exibem loja como dimensão de
   * dados, não como filtro (ex: 2.3, 3.2). Para um seletor de loja com
   * opções reais (não texto livre), use `extraFilters` (ex: Vendas por Item).
   */
  showLoja?: boolean;
  /**
   * Seletores adicionais (Loja/Marca/Grupo/Família/Linha/Tipo de Preço no
   * relatório Vendas por Item, a pedido direto do usuário — "não localizei
   * os filtros"). Cada um vira um `<select>` com as opções realmente
   * presentes no dado, não uma lista inventada.
   */
  extraFilters?: readonly ExtraSelectFilter[];
  /**
   * `'horizontal'` (padrão): campos lado a lado, para a barra de período no
   * topo da página. `'vertical'`: campos empilhados, para uma barra lateral
   * de filtros (Vendas por Item, a pedido direto do usuário).
   */
  layout?: 'horizontal' | 'vertical';
};

/**
 * Filtro compartilhado por período (+ loja e seletores extras opcionais),
 * usado pelo Painel (Story 1.5) e pelos relatórios da Epic 2/3 — "filtros de
 * período e loja aplicáveis a qualquer relatório" é um paradigma-chave do
 * produto [Source: docs/prd/user-interface-design-goals.md#Paradigmas-Chave de Interação].
 *
 * Empurra o filtro para a URL (`?dataInicial=&dataFinal=&loja=&marca=...`)
 * em vez de manter estado local: a página que consome isto é um Server
 * Component que lê `searchParams` — o filtro sobrevive a um reload e é
 * compartilhável por link, sem exigir nenhuma chamada de API
 * cliente-servidor além da navegação.
 *
 * **Composição com múltiplas instâncias na mesma página** (ex: período no
 * topo + seletores extras numa barra lateral, Vendas por Item): cada
 * instância só mexe nos parâmetros de URL que ela mesma gerencia
 * (`managedKeys`) — os demais parâmetros já presentes na URL (geridos por
 * outra instância) são preservados, nunca apagados.
 */
export function ReportFilterForm({
  showPeriod = true,
  showLoja = false,
  extraFilters = [],
  layout = 'horizontal',
}: ReportFilterFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [dataInicial, setDataInicial] = useState(searchParams.get('dataInicial') ?? '');
  const [dataFinal, setDataFinal] = useState(searchParams.get('dataFinal') ?? '');
  const [loja, setLoja] = useState(searchParams.get('loja') ?? '');
  const [extraValues, setExtraValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(extraFilters.map((f) => [f.key, searchParams.get(f.key) ?? ''])),
  );

  const hasAnyExtraValue = Object.values(extraValues).some((v) => v);

  const managedKeys = [
    ...(showPeriod ? ['dataInicial', 'dataFinal'] : []),
    ...(showLoja ? ['loja'] : []),
    ...extraFilters.map((f) => f.key),
  ];

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    // Parte da URL atual (preserva o que outra instância desta forma, numa
    // outra parte da página, já tiver definido) e só reescreve as chaves que
    // esta instância gerencia.
    const params = new URLSearchParams(searchParams.toString());
    for (const key of managedKeys) params.delete(key);

    if (showPeriod && dataInicial) params.set('dataInicial', dataInicial);
    if (showPeriod && dataFinal) params.set('dataFinal', dataFinal);
    if (showLoja && loja.trim()) params.set('loja', loja.trim());
    for (const filter of extraFilters) {
      const value = extraValues[filter.key];
      if (value) params.set(filter.key, value);
    }

    const query = params.toString();
    router.push(query ? `?${query}` : '?');
  };

  const onClear = () => {
    const params = new URLSearchParams(searchParams.toString());
    for (const key of managedKeys) params.delete(key);

    setDataInicial('');
    setDataFinal('');
    setLoja('');
    setExtraValues(Object.fromEntries(extraFilters.map((f) => [f.key, ''])));

    const query = params.toString();
    router.push(query ? `?${query}` : '?');
  };

  const formLayoutClass =
    layout === 'vertical'
      ? 'flex flex-col items-stretch gap-3'
      : 'flex flex-wrap items-end gap-3';

  return (
    <form
      onSubmit={onSubmit}
      className={`${formLayoutClass} rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900`}
    >
      {showPeriod && (
        <>
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
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
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
              className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
          </div>
        </>
      )}

      {showLoja && (
        <div className="space-y-1">
          <label
            htmlFor="loja"
            className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            Loja
          </label>
          <input
            id="loja"
            type="text"
            value={loja}
            onChange={(event) => setLoja(event.target.value)}
            placeholder="Todas"
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      )}

      {extraFilters.map((filter) => (
        <div key={filter.key} className="space-y-1">
          <label
            htmlFor={filter.key}
            className="block text-xs font-medium text-zinc-500 dark:text-zinc-400"
          >
            {filter.label}
          </label>
          <select
            id={filter.key}
            value={extraValues[filter.key] ?? ''}
            onChange={(event) =>
              setExtraValues((prev) => ({ ...prev, [filter.key]: event.target.value }))
            }
            className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          >
            <option value="">Todos</option>
            {filter.options.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>
      ))}

      <div className={layout === 'vertical' ? 'flex gap-3 pt-1' : 'contents'}>
        <button
          type="submit"
          className="rounded-lg bg-zinc-900 px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Filtrar
        </button>

        {(dataInicial || dataFinal || loja || hasAnyExtraValue) && (
          <button
            type="button"
            onClick={onClear}
            className="rounded-lg border border-zinc-300 px-4 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Limpar
          </button>
        )}
      </div>
    </form>
  );
}
