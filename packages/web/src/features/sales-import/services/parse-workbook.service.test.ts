import { describe, expect, it } from 'vitest';

import { SalesImportError } from '../sales-import.contract';
import { parseWorkbook } from './parse-workbook.service';

const HEADER = [
  'Tipo',
  'Loja',
  'Marca Itens',
  'Grupo Itens',
  'Família Itens',
  'Linha Itens',
  'Item',
  'Quantidade',
  'Preço de Venda',
  'a',
  'Data de Emissão',
  'Prazo Médio',
  'Cliente',
  'Atendente',
  'Nº documento',
  'Id Lançamento',
  'Condições de Pagamento',
  'Tipo de preço',
];

// Índices usados nos testes abaixo (mesma ordem do HEADER acima). Constantes
// literais, não derivadas de `.map`, porque `noUncheckedIndexedAccess`
// tornaria cada uma `number | undefined` — inválido como nome de propriedade
// computado.
const TIPO = 0;
const PRECO = 8;
const TOTAL = 9;
const PRAZO = 11;

function row(overrides: Partial<Record<number, unknown>> = {}): unknown[] {
  const base: unknown[] = [
    'Venda', // Tipo
    'Loja 01', // Loja
    'Marca X', // Marca
    'Grupo X', // Grupo
    'Familia X', // Familia
    'Linha X', // Linha
    'Pneu 175/65', // Item
    2, // Quantidade
    775, // Preco
    1550, // Total (bate com 2 * 775)
    '09/07/2026', // Data
    45, // Prazo
    'Cliente X', // Cliente
    'Atendente X', // Atendente
    897699, // Nº documento
    1848158, // Id Lançamento
    '6 - BOLETO', // Condição
    'Padrão', // Tipo de preço
  ];
  for (const [index, value] of Object.entries(overrides)) {
    base[Number(index)] = value;
  }
  return base;
}

describe('parseWorkbook', () => {
  it('converte linhas válidas e preserva o mapeamento de campos', () => {
    const result = parseWorkbook([HEADER, row()]);

    expect(result.rejected).toEqual([]);
    expect(result.validRows).toHaveLength(1);
    expect(result.validRows[0]).toMatchObject({
      tipo: 'VENDA',
      loja: 'Loja 01',
      quantidade: '2.000',
      preco: '775.00',
      valorTotal: '1550.00',
      prazoMedio: '45.00',
      cliente: 'Cliente X',
      numeroDocumento: '897699',
    });
    expect(result.validRows[0]?.dataEmissao.toISOString()).toBe('2026-07-09T00:00:00.000Z');
  });

  it('rejeita linha com Tipo inválido, mantendo o número de linha do Excel', () => {
    const result = parseWorkbook([HEADER, row(), row({ [TIPO]: 'Orçamento' })]);

    expect(result.validRows).toHaveLength(1);
    expect(result.rejected).toHaveLength(1);
    expect(result.rejected[0]?.row).toBe(3); // cabeçalho=1, primeira linha=2, segunda=3
    expect(result.rejected[0]?.reason).toContain('Tipo');
  });

  it('aceita Prazo Médio fracionário (achado real da importação de 2026-09-02: maioria das linhas não é inteiro)', () => {
    const result = parseWorkbook([HEADER, row({ [PRAZO]: 105.17 })]);
    expect(result.rejected).toEqual([]);
    expect(result.validRows[0]?.prazoMedio).toBe('105.17');
  });

  it('aceita Preço em branco (nullable no schema) sem rejeitar a linha', () => {
    const result = parseWorkbook([HEADER, row({ [PRECO]: null })]);
    expect(result.rejected).toEqual([]);
    expect(result.validRows[0]?.preco).toBeNull();
  });

  it('rejeita linha com campo monetário obrigatório ausente (Total)', () => {
    const result = parseWorkbook([HEADER, row({ [TOTAL]: null })]);
    expect(result.validRows).toHaveLength(0);
    expect(result.rejected).toHaveLength(1);
  });

  it('lança SalesImportError se a planilha não tiver cabeçalho', () => {
    expect(() => parseWorkbook([])).toThrow(SalesImportError);
  });

  it('lança SalesImportError se colunas obrigatórias estiverem ausentes', () => {
    expect(() => parseWorkbook([['Só Uma Coluna'], ['x']])).toThrow(SalesImportError);
  });

  it('lança SalesImportError se a coluna de Total não bater com Quantidade × Preço (mapeamento errado)', () => {
    const badRows = Array.from({ length: 10 }, () => row({ [TOTAL]: 999_999 }));
    expect(() => parseWorkbook([HEADER, ...badRows])).toThrow(SalesImportError);
  });

  it('não aborta quando só uma minoria (≤5%) foge da tolerância', () => {
    const goodRows = Array.from({ length: 95 }, () => row());
    // Fora da tolerância de fato (não é só arredondamento de centavos), mas
    // só 5% da amostra — abaixo do limiar que aborta a importação.
    const outliers = Array.from({ length: 5 }, () => row({ [TOTAL]: 3100 }));
    const result = parseWorkbook([HEADER, ...goodRows, ...outliers]);
    expect(result.validRows).toHaveLength(100);
  });
});
