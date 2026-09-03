import type { ReportFilter } from '@/shared/report-filters/report-filter.contract';

/**
 * Uma linha de "Vendas por Item" (Story 2.2, AC1).
 *
 * `faturamento`, `linha`, `marca` e `tipoPreco` foram adicionados depois do
 * AC1 original (que só pedia quantidade por Família/Grupo/Item) a pedido
 * direto do usuário/gestor — ver Change Log da Story 2.2.
 */
export type VendasPorItemRow = {
  linha: string;
  familia: string;
  grupo: string;
  marca: string;
  item: string;
  tipoPreco: string;
  quantidade: number;
  faturamento: number;
};

/** Mesma linha, com a dimensão Loja (Story 2.3, AC1). */
export type VendasPorItemPorLojaRow = VendasPorItemRow & { loja: string };

/**
 * Uma linha de resumo (Grupo ou Loja) — total sem o detalhe de
 * Item/Marca/Tipo de Preço, a pedido direto do usuário: "tenho como ver o
 * resumo por cada grupo e resumido por loja". `chave` é o nome do Grupo ou
 * da Loja, dependendo de qual resumo é.
 */
export type VendasPorItemResumoRow = {
  chave: string;
  quantidade: number;
  faturamento: number;
};

/** Valores distintos existentes no dado, para popular os seletores do filtro. */
export type VendasPorItemOpcoesDeFiltro = {
  lojas: string[];
  marcas: string[];
  grupos: string[];
  familias: string[];
  linhas: string[];
  tiposPreco: string[];
};

export interface VendasPorItemContract {
  /** Agrupado por Linha/Família/Grupo/Marca/Item/Tipo de Preço, ordenado por quantidade decrescente (AC3 da 2.2). */
  getPorItem(filter?: ReportFilter): Promise<VendasPorItemRow[]>;
  /** Mesma visão com a dimensão Loja (Story 2.3). */
  getPorItemPorLoja(filter?: ReportFilter): Promise<VendasPorItemPorLojaRow[]>;
  /** Resumo (sem detalhe de item) por Grupo, ordenado por faturamento decrescente. */
  getResumoPorGrupo(filter?: ReportFilter): Promise<VendasPorItemResumoRow[]>;
  /** Resumo (sem detalhe de item) por Loja, ordenado por faturamento decrescente. */
  getResumoPorLoja(filter?: ReportFilter): Promise<VendasPorItemResumoRow[]>;
  /** Opções para os seletores de Marca/Grupo/Família/Linha/Tipo de Preço. */
  getOpcoesDeFiltro(): Promise<VendasPorItemOpcoesDeFiltro>;
}
