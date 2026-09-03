/**
 * Faixas de "Prazo Médio" (Story 2.4, FR5) — fornecidas pelo gestor em
 * 2026-09-03 (não havia como derivá-las do dado: a coluna `Faixa Prazo
 * Médio` do export de referência está vazia em 100% das linhas, TD-04
 * Achado 4; risco R5 em `docs/architecture/tech-decisions.md`).
 *
 * P4 a P9 são faixas crescentes de dias (limites exatos do gestor). P1 é a
 * faixa acima do teto de P9 — o gestor a descreveu como "vendas em até 6x no
 * cartão de crédito", cujo prazo médio observado costuma girar em torno de
 * 250 dias; isso é a referência de negócio para a faixa, não um limite
 * inferior fixo — qualquer prazo médio acima de P9 cai em P1.
 */
export type FaixaPrazoMedio = {
  codigo: string;
  label: string;
  /** Teto (inclusive) da faixa, em dias — `null` para a última (sem teto). */
  max: number | null;
};

/**
 * Ordenadas por `max` crescente, de propósito: `faixaDoPrazoMedio` usa a
 * primeira cujo teto ainda comporta o valor. `prazoMedio` é `Decimal(8,2)`
 * (Story 1.3/1.4) — pode ser fracionário (ex: 34,5) — então os limites são
 * cascateados (`<= max`), não intervalos `[min, max]` independentes: um par
 * `min`/`max` fixo deixaria um buraco entre, por exemplo, 34 e 35 onde 34,5
 * não cairia em faixa nenhuma.
 */
export const FAIXAS_PRAZO_MEDIO: readonly FaixaPrazoMedio[] = [
  { codigo: 'P4', label: 'P4 (0 a 34 dias)', max: 34 },
  { codigo: 'P5', label: 'P5 (35 a 47 dias)', max: 47 },
  { codigo: 'P6', label: 'P6 (48 a 62 dias)', max: 62 },
  { codigo: 'P7', label: 'P7 (63 a 77 dias)', max: 77 },
  { codigo: 'P8', label: 'P8 (78 a 92 dias)', max: 92 },
  { codigo: 'P9', label: 'P9 (93 a 109 dias)', max: 109 },
  { codigo: 'P1', label: 'P1 (acima de 109 dias)', max: null },
];

/**
 * Resolve a faixa de um `prazoMedio` (dias). Um prazo médio negativo não
 * deveria existir no dado real (TD-04) — se acontecer mesmo assim, cai na
 * faixa mais baixa (P4) em vez de lançar, para uma linha com dado estranho
 * não derrubar o relatório inteiro.
 */
export function faixaDoPrazoMedio(prazoMedio: number): FaixaPrazoMedio {
  if (prazoMedio < 0) return FAIXAS_PRAZO_MEDIO[0]!;

  // A última faixa tem `max: null`, então sempre há uma correspondência.
  return FAIXAS_PRAZO_MEDIO.find((f) => f.max === null || prazoMedio <= f.max)!;
}

export type VendasPorFaixaPrazoMedioRow = { faixa: string; faturamento: number };

/**
 * Agrupa lançamentos por faixa de Prazo Médio, somando o faturamento —
 * mesmo padrão de agregação em memória de `faturamento-por-data` (SQL cru
 * não é testável sem Docker; o volume por período filtrado é pequeno o
 * bastante para agregar com segurança, NFR2).
 *
 * A ordem de saída é a ordem crescente de dias das faixas (P4→P9, depois
 * P1) — não alfabética nem por valor — e faixas sem nenhum lançamento no
 * período não aparecem.
 */
export function groupByFaixaPrazoMedio(
  entries: readonly { prazoMedio: number; valorTotal: number }[],
): VendasPorFaixaPrazoMedioRow[] {
  const somaPorFaixa = new Map<string, number>();

  for (const entry of entries) {
    const faixa = faixaDoPrazoMedio(entry.prazoMedio);
    somaPorFaixa.set(faixa.codigo, (somaPorFaixa.get(faixa.codigo) ?? 0) + entry.valorTotal);
  }

  return FAIXAS_PRAZO_MEDIO.filter((f) => somaPorFaixa.has(f.codigo)).map((f) => ({
    faixa: f.label,
    faturamento: somaPorFaixa.get(f.codigo)!,
  }));
}
