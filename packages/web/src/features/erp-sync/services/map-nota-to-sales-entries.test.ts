import { describe, expect, it } from 'vitest';

import { mapNotaToSalesEntries } from './map-nota-to-sales-entries';
import type { NotaFiscal } from './nota-fiscal.schema';

const CONTEXT = { loja: '01 - MT', tipoPrecoPorCodigo: new Map([[1, 'VAREJO'], [2, 'ATACADO']]) };

function nota(overrides: Partial<NotaFiscal> = {}): NotaFiscal {
  return {
    idnotafiscal: 49667,
    idtransacao: 1844468,
    dtaemissao: '2026-07-01T00:00:00',
    valortotalnota: 4256,
    identradasaida: 1,
    descricaoentradaesaida: 'VENDAS DE MERCADORIAS/SERVIÇOS',
    idtipoentradasaida: 2,
    Comercial: { idvendedor: 259315, nomevendedor: 'JOSE NAZARENO', tipopreco: 1 },
    Cliente: { nome: 'CLIENTE TESTE' },
    Produtos: [
      {
        codigo: 5131813,
        descricao: 'P 225/75R16C 10L 118/116R H-188',
        quantidade: 2,
        precounitario: 2128,
        valortotalitem: 4256,
      },
    ],
    Parcelas: [],
    ...overrides,
  };
}

describe('mapNotaToSalesEntries', () => {
  it('mapeia uma nota de venda confirmada para uma linha por produto', () => {
    const rows = mapNotaToSalesEntries(nota(), CONTEXT);

    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({
      tipo: 'VENDA',
      loja: '01 - MT',
      cliente: 'CLIENTE TESTE',
      atendente: 'JOSE NAZARENO',
      item: 'P 225/75R16C 10L 118/116R H-188',
      tipoPreco: 'VAREJO',
      preco: '2128.00',
      valorTotal: '4256.00',
      quantidade: '2.000',
      numeroDocumento: '49667',
      idLancamento: '1844468',
    });
    expect(rows[0]?.dataEmissao.toISOString()).toBe('2026-07-01T00:00:00.000Z');
  });

  it('gera uma linha por item em Produtos (nota com múltiplos itens)', () => {
    const rows = mapNotaToSalesEntries(
      nota({
        Produtos: [
          { codigo: 1, descricao: 'Item A', quantidade: 1, precounitario: 100, valortotalitem: 100 },
          { codigo: 2, descricao: 'Item B', quantidade: 3, precounitario: 50, valortotalitem: 150 },
        ],
      }),
      CONTEXT,
    );

    expect(rows).toHaveLength(2);
    expect(rows[0]?.item).toBe('Item A');
    expect(rows[1]?.item).toBe('Item B');
  });

  it('ignora nota que não é a Venda confirmada (transferência, garantia, etc.) — TD-04 Achado 5', () => {
    expect(mapNotaToSalesEntries(nota({ descricaoentradaesaida: 'SAIDA DE TRANSFERENCIA' }), CONTEXT)).toEqual([]);
    expect(
      mapNotaToSalesEntries(
        nota({ descricaoentradaesaida: 'SAIDA DE GARANTIA  CLIENTE PNEU 100%' }),
        CONTEXT,
      ),
    ).toEqual([]);
    expect(
      mapNotaToSalesEntries(nota({ descricaoentradaesaida: 'VENDA DE MERCADORIAS E SERVICOS' }), CONTEXT),
    ).toEqual([]);
  });

  it('ignora nota de venda sem nenhum produto', () => {
    expect(mapNotaToSalesEntries(nota({ Produtos: [] }), CONTEXT)).toEqual([]);
  });

  it('deixa familia/grupo/marca/linha/condicaoPagamento como null (Achado 8, pendências não inventadas)', () => {
    const rows = mapNotaToSalesEntries(nota(), CONTEXT);
    expect(rows[0]).toMatchObject({
      familia: null,
      grupo: null,
      marca: null,
      linha: null,
      condicaoPagamento: null,
    });
  });

  it('prazoMedio 0 quando não há parcelas (venda à vista)', () => {
    const rows = mapNotaToSalesEntries(nota({ Parcelas: [] }), CONTEXT);
    expect(rows[0]?.prazoMedio).toBe('0.00');
  });

  it('prazoMedio é a média ponderada por valor dos dias até o vencimento de cada parcela', () => {
    const rows = mapNotaToSalesEntries(
      nota({
        dtaemissao: '2026-07-01T00:00:00',
        Parcelas: [
          { dtavencto: '2026-07-31T00:00:00', valordocumento: 100 }, // 30 dias, peso 100
          { dtavencto: '2026-08-30T00:00:00', valordocumento: 300 }, // 60 dias, peso 300
        ],
      }),
      CONTEXT,
    );
    // (30*100 + 60*300) / 400 = (3000 + 18000) / 400 = 52.5
    expect(rows[0]?.prazoMedio).toBe('52.50');
  });

  it('tipoPreco null quando o código não está no catálogo', () => {
    const rows = mapNotaToSalesEntries(nota({ Comercial: { tipopreco: 999 } }), CONTEXT);
    expect(rows[0]?.tipoPreco).toBeNull();
  });

  it('cliente/atendente null quando Comercial/Cliente ausentes', () => {
    const rows = mapNotaToSalesEntries(nota({ Comercial: undefined, Cliente: undefined }), CONTEXT);
    expect(rows[0]?.cliente).toBeNull();
    expect(rows[0]?.atendente).toBeNull();
    expect(rows[0]?.tipoPreco).toBeNull();
  });
});
