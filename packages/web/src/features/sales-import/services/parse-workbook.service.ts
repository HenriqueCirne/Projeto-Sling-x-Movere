import { SalesImportError, type ParsedSalesEntryRow, type RowRejection } from '../sales-import.contract';
import { resolveColumnMap, type ColumnMap, type SalesEntryField } from './column-mapping.service';
import {
  parseDataEmissao,
  parseDecimal,
  parseDecimalNullable,
  parseNullableString,
  parsePrazoMedio,
  parseTipo,
  type ParseResult,
} from './field-parsers';

function cell(rawRow: readonly unknown[], map: ColumnMap, field: SalesEntryField): unknown {
  return rawRow[map[field]] ?? null;
}

function unwrap<T>(result: ParseResult<T>, errors: string[]): T | null {
  if (result.ok) return result.value;
  errors.push(result.error);
  return null;
}

type RowParseResult =
  | { ok: true; row: ParsedSalesEntryRow }
  | { ok: false; rejection: RowRejection };

function parseRow(rawRow: readonly unknown[], map: ColumnMap, rowNumber: number): RowParseResult {
  const errors: string[] = [];

  const tipo = unwrap(parseTipo(cell(rawRow, map, 'tipo')), errors);
  const dataEmissao = unwrap(parseDataEmissao(cell(rawRow, map, 'dataEmissao')), errors);
  const quantidade = unwrap(parseDecimal(cell(rawRow, map, 'quantidade'), 'Quantidade', 3), errors);
  const preco = unwrap(
    parseDecimalNullable(cell(rawRow, map, 'preco'), 'Preço de Venda', 2),
    errors,
  );
  const valorTotal = unwrap(
    parseDecimal(cell(rawRow, map, 'valorTotal'), 'Total Preço de Venda', 2),
    errors,
  );
  const prazoMedio = unwrap(parsePrazoMedio(cell(rawRow, map, 'prazoMedio')), errors);

  const loja = unwrap(parseNullableString(cell(rawRow, map, 'loja')), errors);
  const cliente = unwrap(parseNullableString(cell(rawRow, map, 'cliente')), errors);
  const atendente = unwrap(parseNullableString(cell(rawRow, map, 'atendente')), errors);
  const item = unwrap(parseNullableString(cell(rawRow, map, 'item')), errors);
  const familia = unwrap(parseNullableString(cell(rawRow, map, 'familia')), errors);
  const grupo = unwrap(parseNullableString(cell(rawRow, map, 'grupo')), errors);
  const marca = unwrap(parseNullableString(cell(rawRow, map, 'marca')), errors);
  const linha = unwrap(parseNullableString(cell(rawRow, map, 'linha')), errors);
  const tipoPreco = unwrap(parseNullableString(cell(rawRow, map, 'tipoPreco')), errors);
  const condicaoPagamento = unwrap(
    parseNullableString(cell(rawRow, map, 'condicaoPagamento')),
    errors,
  );
  const numeroDocumento = unwrap(
    parseNullableString(cell(rawRow, map, 'numeroDocumento')),
    errors,
  );
  const idLancamento = unwrap(parseNullableString(cell(rawRow, map, 'idLancamento')), errors);

  if (
    errors.length > 0 ||
    tipo === null ||
    dataEmissao === null ||
    quantidade === null ||
    valorTotal === null ||
    prazoMedio === null
  ) {
    return {
      ok: false,
      rejection: { row: rowNumber, reason: errors.join('; ') || 'linha inválida' },
    };
  }

  return {
    ok: true,
    row: {
      tipo,
      dataEmissao,
      quantidade,
      preco,
      valorTotal,
      prazoMedio,
      loja,
      cliente,
      atendente,
      item,
      familia,
      grupo,
      marca,
      linha,
      tipoPreco,
      condicaoPagamento,
      numeroDocumento,
      idLancamento,
    },
  };
}

const SANITY_SAMPLE_SIZE = 500;
const SANITY_MAX_MISMATCH_RATIO = 0.05;

/**
 * Confere, por amostragem, que a coluna resolvida como "Total Preço de
 * Venda" bate com Quantidade × Preço de Venda (TD-04). Não é um recálculo —
 * `valorTotal` é gravado como veio da planilha — é uma rede de segurança
 * contra a coluna ter sido mapeada errado (a planilha de 2026-09-01 tem essa
 * coluna com o cabeçalho corrompido, ver `column-mapping.service.ts`).
 *
 * @throws {SalesImportError} Se a proporção de linhas fora da tolerância
 * exceder {@link SANITY_MAX_MISMATCH_RATIO} — aborta ANTES de qualquer
 * escrita no banco.
 */
function assertValorTotalSanity(rows: readonly ParsedSalesEntryRow[]): void {
  const sample = rows.filter((row) => row.preco !== null).slice(0, SANITY_SAMPLE_SIZE);
  if (sample.length === 0) return;

  let mismatches = 0;
  for (const row of sample) {
    const expected = Number(row.quantidade) * Number(row.preco);
    const actual = Number(row.valorTotal);
    const tolerance = Math.max(0.05, Math.abs(actual) * 0.01);
    if (Math.abs(expected - actual) > tolerance) mismatches++;
  }

  const mismatchRatio = mismatches / sample.length;
  if (mismatchRatio > SANITY_MAX_MISMATCH_RATIO) {
    throw new SalesImportError(
      `A coluna de "Total Preço de Venda" não bate com Quantidade × Preço de Venda em ` +
        `${(mismatchRatio * 100).toFixed(1)}% de uma amostra de ${sample.length} linhas — ` +
        'a coluna pode ter sido mapeada errado. Importação abortada antes de qualquer escrita no banco.',
    );
  }
}

export type ParseWorkbookResult = {
  validRows: ParsedSalesEntryRow[];
  rejected: RowRejection[];
};

/**
 * Converte as linhas brutas de uma planilha (array-of-arrays, linha 1 =
 * cabeçalho) em linhas prontas para `sales_entries`.
 *
 * @throws {SalesImportError} Planilha vazia, colunas obrigatórias ausentes,
 * ou a checagem de sanidade de `valorTotal` falhar.
 */
export function parseWorkbook(rawRows: readonly (readonly unknown[])[]): ParseWorkbookResult {
  const [headerRow, ...dataRows] = rawRows;
  if (!headerRow) {
    throw new SalesImportError('A planilha está vazia — nenhuma linha de cabeçalho encontrada.');
  }

  const columnMap = resolveColumnMap(headerRow);

  const validRows: ParsedSalesEntryRow[] = [];
  const rejected: RowRejection[] = [];

  dataRows.forEach((rawRow, index) => {
    const rowNumber = index + 2; // linha 1 = cabeçalho
    const result = parseRow(rawRow, columnMap, rowNumber);
    if (result.ok) {
      validRows.push(result.row);
    } else {
      rejected.push(result.rejection);
    }
  });

  assertValorTotalSanity(validRows);

  return { validRows, rejected };
}
