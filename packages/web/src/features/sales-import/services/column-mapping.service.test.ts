import { describe, expect, it } from 'vitest';

import { SalesImportError } from '../sales-import.contract';
import { resolveColumnMap } from './column-mapping.service';

const REAL_HEADER_SAMPLE = [
  'Tipo',
  'Cód Loja',
  'Loja',
  'Cód Marca Itens',
  'Marca Itens',
  'Cód Grupo Itens',
  'Grupo Itens',
  'Cód Família Itens',
  'Família Itens',
  'Cód Linha Itens',
  'Linha Itens',
  'Cód Item',
  'Item',
  'Quantidade',
  'Preço de Venda',
  'Preço de Tabela',
  'Custo de Reposição',
  'Custo Médio',
  'Custo Informado',
  'Total Custo Médio',
  'a',
  'Data de Emissão',
  'Prazo Médio',
  'Cód Cliente',
  'Cliente',
];

describe('resolveColumnMap', () => {
  it('mapeia todos os campos de um cabeçalho real, incluindo o "a" corrompido de Total Preço de Venda', () => {
    const header = [
      ...REAL_HEADER_SAMPLE,
      'Atendente completo aqui', // ruído — não deve casar com nada
      'Nº documento',
      'Id Lançamento',
      'Condições de Pagamento',
      'Tipo de preço',
      'Atendente',
    ];

    const map = resolveColumnMap(header);

    expect(map.tipo).toBe(0);
    expect(map.loja).toBe(2);
    expect(map.quantidade).toBe(13);
    expect(map.preco).toBe(14);
    expect(map.valorTotal).toBe(20);
    expect(map.dataEmissao).toBe(21);
    expect(map.prazoMedio).toBe(22);
    expect(map.cliente).toBe(24);
    expect(map.atendente).toBe(header.length - 1);
  });

  it('é insensível a maiúsculas/minúsculas e a espaços nas bordas', () => {
    const header = ['  TIPO  ', 'loja', 'CLIENTE'];
    const map = resolveColumnMap([
      ...header,
      'Quantidade',
      'Preço de Venda',
      'Total Preço de Venda',
      'Data de Emissão',
      'Prazo Médio',
      'Atendente',
      'Marca Itens',
      'Grupo Itens',
      'Família Itens',
      'Linha Itens',
      'Item',
      'Nº documento',
      'Id Lançamento',
      'Condições de Pagamento',
      'Tipo de preço',
    ]);
    expect(map.tipo).toBe(0);
    expect(map.loja).toBe(1);
    expect(map.cliente).toBe(2);
  });

  it('lança SalesImportError listando todas as colunas obrigatórias ausentes', () => {
    expect(() => resolveColumnMap(['Alguma Coluna Qualquer'])).toThrow(SalesImportError);
    try {
      resolveColumnMap(['Alguma Coluna Qualquer']);
      throw new Error('deveria ter lançado');
    } catch (error) {
      expect(error).toBeInstanceOf(SalesImportError);
      expect((error as Error).message).toContain('tipo');
      expect((error as Error).message).toContain('valorTotal');
    }
  });
});
