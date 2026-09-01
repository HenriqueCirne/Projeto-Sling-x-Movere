import { SalesImportError } from '../sales-import.contract';

export type SalesEntryField =
  | 'tipo'
  | 'loja'
  | 'marca'
  | 'grupo'
  | 'familia'
  | 'linha'
  | 'item'
  | 'quantidade'
  | 'preco'
  | 'dataEmissao'
  | 'prazoMedio'
  | 'cliente'
  | 'atendente'
  | 'numeroDocumento'
  | 'idLancamento'
  | 'condicaoPagamento'
  | 'tipoPreco'
  | 'valorTotal';

/**
 * Nomes de cabeçalho aceitos por campo — todos observados nos exports reais
 * do ERP (TD-04, TD-07). Todo campo é obrigatório: se a coluna não existe na
 * planilha, a importação para antes de escrever qualquer coisa no banco.
 */
const HEADER_ALIASES: Record<SalesEntryField, readonly string[]> = {
  tipo: ['Tipo'],
  loja: ['Loja'],
  marca: ['Marca Itens'],
  grupo: ['Grupo Itens'],
  familia: ['Família Itens', 'Familia Itens'],
  linha: ['Linha Itens'],
  item: ['Item'],
  quantidade: ['Quantidade'],
  preco: ['Preço de Venda', 'Preco de Venda'],
  dataEmissao: ['Data de Emissão', 'Data de Emissao'],
  prazoMedio: ['Prazo Médio', 'Prazo Medio'],
  cliente: ['Cliente'],
  atendente: ['Atendente'],
  numeroDocumento: ['Nº documento', 'N° documento', 'Numero documento', 'Número documento'],
  idLancamento: ['Id Lançamento', 'Id Lancamento'],
  condicaoPagamento: ['Condições de Pagamento', 'Condicoes de Pagamento'],
  tipoPreco: ['Tipo de preço', 'Tipo de preco'],
  /**
   * "Total Preço de Venda" (TD-04). Na planilha enviada em 2026-09-01 esta
   * coluna veio com o cabeçalho corrompido para "a" (provável erro de edição
   * na fonte, não um layout novo). Aceito como alias exato — não é um
   * fallback silencioso de posição — porque `parseWorkbook` ainda confere por
   * amostragem se os valores batem com Quantidade × Preço de Venda antes de
   * qualquer linha ser aceita.
   */
  valorTotal: ['Total Preço de Venda', 'Total Preco de Venda', 'a'],
};

export type ColumnMap = Record<SalesEntryField, number>;

/**
 * Resolve o cabeçalho da planilha (linha 1) para o índice de cada campo.
 *
 * @throws {SalesImportError} Se alguma coluna obrigatória não for encontrada.
 */
export function resolveColumnMap(headerRow: readonly unknown[]): ColumnMap {
  const normalizedHeaders = headerRow.map((cell) =>
    typeof cell === 'string' ? cell.trim().toLowerCase() : null,
  );

  const map = {} as ColumnMap;
  const missing: string[] = [];

  for (const field of Object.keys(HEADER_ALIASES) as SalesEntryField[]) {
    const aliases = HEADER_ALIASES[field].map((alias) => alias.toLowerCase());
    const index = normalizedHeaders.findIndex((header) => header !== null && aliases.includes(header));

    if (index === -1) {
      missing.push(`${field} (esperado um destes cabeçalhos: ${HEADER_ALIASES[field].join(', ')})`);
      continue;
    }

    map[field] = index;
  }

  if (missing.length > 0) {
    throw new SalesImportError(
      `Não foi possível localizar colunas obrigatórias na planilha: ${missing.join('; ')}`,
    );
  }

  return map;
}
