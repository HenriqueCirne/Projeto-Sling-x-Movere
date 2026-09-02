import type { SalesEntryRow } from '../../../shared/sales-entries/sales-entry.contract';
import type { NotaFiscal } from './nota-fiscal.schema';

/**
 * Única `descricaoentradaesaida` confirmada como Venda de verdade nesta
 * amostra (TD-04 Achado 5, reconfirmado no Achado 8: 92-93/100 notas de uma
 * janela de 2 meses). Transferências, garantias e o caso ambíguo observado
 * uma única vez ficam de fora — incluí-los sem confirmação inflaria o
 * faturamento com movimento que não é venda (o risco que o próprio Achado 5
 * já tinha descrito). "Devolução" não tem assinatura confirmada ainda (Achado
 * 8): nenhuma nota de devolução apareceu em nenhuma amostra testada, então
 * esta função não classifica nada como `DEVOLUCAO` — seria inventar um
 * mapeamento sem dado real (Artigo IV — No Invention).
 */
const DESCRICAO_VENDA_CONFIRMADA = 'VENDAS DE MERCADORIAS/SERVIÇOS';

function toDecimalString(value: number, fractionDigits: number): string {
  return value.toFixed(fractionDigits);
}

/** "2026-08-03T00:00:00" (sem timezone) → meia-noite UTC do mesmo dia. */
function parseApiDate(isoLike: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(isoLike);
  if (!match) {
    throw new Error(`Data em formato inesperado vinda da API Moveres: "${isoLike}"`);
  }
  const [, year, month, day] = match as unknown as [string, string, string, string];
  return new Date(Date.UTC(Number(year), Number(month) - 1, Number(day)));
}

/**
 * "Prazo Médio" (TD-04, Achado 4/6): média dos dias até o vencimento de cada
 * parcela, ponderada pelo valor de cada uma — a hipótese já registrada no
 * Achado 6, agora testável porque `Parcelas` deixou de vir vazio (Achado 8).
 * Nota à vista (sem parcelas) tem prazo médio 0 — condizente com
 * `diasDasParcelas: "0"` de "DINHEIRO" no catálogo `CondicoesDePagamento`.
 */
function computePrazoMedio(nota: NotaFiscal, dataEmissaoNota: Date): number {
  const parcelas = nota.Parcelas ?? [];
  if (parcelas.length === 0) return 0;

  const valorTotal = parcelas.reduce((sum, parcela) => sum + parcela.valordocumento, 0);
  if (valorTotal <= 0) return 0;

  const somaPonderada = parcelas.reduce((sum, parcela) => {
    const vencimento = parseApiDate(parcela.dtavencto);
    const dias = (vencimento.getTime() - dataEmissaoNota.getTime()) / (24 * 60 * 60 * 1000);
    return sum + dias * parcela.valordocumento;
  }, 0);

  return somaPonderada / valorTotal;
}

export type MapNotaContext = {
  /** Nome da loja já resolvido (catálogo `Estabelecimentos`), não o código. */
  loja: string;
  /** `codigoTipoPreco` (de `Comercial.tipopreco`) → nome (catálogo `TiposDePrecos`). */
  tipoPrecoPorCodigo: ReadonlyMap<number, string>;
};

/**
 * Converte uma nota fiscal em zero, uma ou várias linhas de `sales_entries`
 * (uma por item em `Produtos`) — ou `[]` se a nota não for uma venda
 * confirmada (ver {@link DESCRICAO_VENDA_CONFIRMADA}).
 *
 * Duas dimensões ficam sempre `null` nesta versão, de propósito, não por
 * esquecimento (Achado 8, pendências 1 e 2 — sem mapeamento confirmado):
 * - `familia`/`grupo`/`marca`/`linha`: precisam de um lookup por `codigo`
 *   contra um catálogo de classificação (`EstruturasDeItens`), não
 *   implementado ainda.
 * - `condicaoPagamento`: nenhum campo de `Parcelas` bate com `codigoCondicao`
 *   do catálogo `CondicoesDePagamento` na amostra testada.
 */
export function mapNotaToSalesEntries(
  nota: NotaFiscal,
  context: MapNotaContext,
): SalesEntryRow[] {
  if (nota.descricaoentradaesaida !== DESCRICAO_VENDA_CONFIRMADA) {
    return [];
  }

  const produtos = nota.Produtos ?? [];
  if (produtos.length === 0) return [];

  const dataEmissao = parseApiDate(nota.dtaemissao);
  const prazoMedio = computePrazoMedio(nota, dataEmissao);
  const tipoPreco =
    nota.Comercial?.tipopreco !== undefined
      ? (context.tipoPrecoPorCodigo.get(nota.Comercial.tipopreco) ?? null)
      : null;

  return produtos.map(
    (produto): SalesEntryRow => ({
      tipo: 'VENDA',
      dataEmissao,
      loja: context.loja,
      cliente: nota.Cliente?.nome ?? null,
      atendente: nota.Comercial?.nomevendedor ?? null,
      item: produto.descricao,
      familia: null,
      grupo: null,
      marca: null,
      linha: null,
      tipoPreco,
      condicaoPagamento: null,
      preco: toDecimalString(produto.precounitario, 2),
      valorTotal: toDecimalString(produto.valortotalitem, 2),
      quantidade: toDecimalString(produto.quantidade, 3),
      prazoMedio: toDecimalString(prazoMedio, 2),
      numeroDocumento: String(nota.idnotafiscal),
      idLancamento: nota.idtransacao !== undefined ? String(nota.idtransacao) : null,
    }),
  );
}
