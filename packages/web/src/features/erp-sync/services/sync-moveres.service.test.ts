import { describe, expect, it, vi } from 'vitest';

import type { SalesEntryRow } from '../../../shared/sales-entries/sales-entry.contract';
import type { SalesEntriesPrismaClient } from '../../../shared/sales-entries/replace-window.repository';
import { syncMoveres } from './sync-moveres.service';

const CONFIG = {
  baseUrl: 'https://api.example.test',
  ambiente: 'Ambiente',
  usuario: 'user',
  senha: 'pass',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function createFakePrisma() {
  const store: SalesEntryRow[] = [];
  const prisma: SalesEntriesPrismaClient = {
    $transaction: async (fn) =>
      fn({
        salesEntry: {
          deleteMany: async () => ({ count: 0 }),
          createMany: async (args) => {
            store.push(...args.data);
            return { count: args.data.length };
          },
        },
      }),
  };
  return { prisma, getStore: () => store };
}

const NOTA_VENDA = {
  NF: {
    idnotafiscal: 1,
    idtransacao: 10,
    dtaemissao: '2026-07-01T00:00:00',
    valortotalnota: 100,
    identradasaida: 1,
    descricaoentradaesaida: 'VENDAS DE MERCADORIAS/SERVIÇOS',
    idtipoentradasaida: 2,
    Comercial: { idvendedor: 1, nomevendedor: 'Vendedor X', tipopreco: 1 },
    Cliente: { nome: 'Cliente X' },
    Produtos: [
      { codigo: 1, descricao: 'Item X', quantidade: 1, precounitario: 100, valortotalitem: 100 },
    ],
    Parcelas: [],
  },
};

/** Sequência de respostas fetch: login -> Estabelecimentos + TiposDePrecos (ordem via Promise.all) -> notas por loja. */
function mockFetchSequence(responses: unknown[]) {
  const fetchImpl = vi.fn();
  for (const response of responses) {
    fetchImpl.mockResolvedValueOnce(response instanceof Response ? response : jsonResponse(response));
  }
  return fetchImpl;
}

describe('syncMoveres', () => {
  it('sincroniza todas as lojas ativas e agrega o resultado', async () => {
    const fetchImpl = mockFetchSequence([
      { token: 'tok', grupo: { codigo: 5, nome: 'SEM ACESSO' } }, // login
      [
        { codigoEstabelecimento: 1, nome: '01 - MT', ativo: true },
        { codigoEstabelecimento: 2, nome: '02 - PO', ativo: true },
      ], // Estabelecimentos
      [{ codigoTipoPreco: 1, nome: 'VAREJO' }], // TiposDePrecos
      [NOTA_VENDA], // notas loja 1, pagina 1
      [], // notas loja 1, pagina 2 (fim)
      [NOTA_VENDA], // notas loja 2, pagina 1
      [], // notas loja 2, pagina 2 (fim)
    ]);
    const { prisma, getStore } = createFakePrisma();

    const summary = await syncMoveres(
      { emissaoInicial: '2026-07-01', emissaoFinal: '2026-07-31' },
      CONFIG,
      { prisma, fetchImpl },
    );

    expect(summary.lojas).toHaveLength(2);
    expect(summary.lojas.every((l) => l.ok)).toBe(true);
    expect(getStore()).toHaveLength(2); // 1 linha por loja
  });

  it('ignora loja inativa', async () => {
    const fetchImpl = mockFetchSequence([
      { token: 'tok' },
      [
        { codigoEstabelecimento: 1, nome: '01 - MT', ativo: true },
        { codigoEstabelecimento: 2, nome: '02 - INATIVA', ativo: false },
      ],
      [],
      [NOTA_VENDA],
      [],
    ]);
    const { prisma } = createFakePrisma();

    const summary = await syncMoveres(
      { emissaoInicial: '2026-07-01', emissaoFinal: '2026-07-31' },
      CONFIG,
      { prisma, fetchImpl },
    );

    expect(summary.lojas).toHaveLength(1);
    expect(summary.lojas[0]?.nomeLoja).toBe('01 - MT');
  });

  it('isola a falha de uma loja — as outras continuam sendo sincronizadas (AC5)', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce(jsonResponse({ token: 'tok' })) // login
      .mockResolvedValueOnce(
        jsonResponse([
          { codigoEstabelecimento: 1, nome: 'Loja com erro', ativo: true },
          { codigoEstabelecimento: 2, nome: 'Loja OK', ativo: true },
        ]),
      ) // Estabelecimentos
      .mockResolvedValueOnce(jsonResponse([])) // TiposDePrecos
      .mockResolvedValueOnce(jsonResponse({}, 503)) // loja 1: falha HTTP
      .mockResolvedValueOnce(jsonResponse([NOTA_VENDA])) // loja 2, pagina 1
      .mockResolvedValueOnce(jsonResponse([])); // loja 2, pagina 2

    const { prisma, getStore } = createFakePrisma();

    const summary = await syncMoveres(
      { emissaoInicial: '2026-07-01', emissaoFinal: '2026-07-31' },
      CONFIG,
      { prisma, fetchImpl },
    );

    expect(summary.lojas).toHaveLength(2);
    const [lojaComErro, lojaOk] = summary.lojas;
    expect(lojaComErro?.ok).toBe(false);
    expect(lojaOk?.ok).toBe(true);
    expect(getStore()).toHaveLength(1); // só a loja OK escreveu
  });

  it('chama onLojaResult a cada loja processada (progresso em tempo real, AC3)', async () => {
    const fetchImpl = mockFetchSequence([
      { token: 'tok' },
      [{ codigoEstabelecimento: 1, nome: '01 - MT', ativo: true }],
      [],
      [NOTA_VENDA],
      [],
    ]);
    const { prisma } = createFakePrisma();
    const onLojaResult = vi.fn();

    await syncMoveres(
      { emissaoInicial: '2026-07-01', emissaoFinal: '2026-07-31' },
      CONFIG,
      { prisma, fetchImpl, onLojaResult },
    );

    expect(onLojaResult).toHaveBeenCalledTimes(1);
    expect(onLojaResult).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it('propaga erro de login sem tentar sincronizar nenhuma loja', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(jsonResponse({}, 401));
    const { prisma } = createFakePrisma();

    await expect(
      syncMoveres(
        { emissaoInicial: '2026-07-01', emissaoFinal: '2026-07-31' },
        CONFIG,
        { prisma, fetchImpl },
      ),
    ).rejects.toThrow();
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it('conta notas ignoradas (não-venda) separadamente das inseridas', async () => {
    const notaTransferencia = {
      NF: { ...NOTA_VENDA.NF, idnotafiscal: 2, descricaoentradaesaida: 'SAIDA DE TRANSFERENCIA' },
    };
    const fetchImpl = mockFetchSequence([
      { token: 'tok' },
      [{ codigoEstabelecimento: 1, nome: '01 - MT', ativo: true }],
      [],
      [NOTA_VENDA, notaTransferencia],
      [],
    ]);
    const { prisma } = createFakePrisma();

    const summary = await syncMoveres(
      { emissaoInicial: '2026-07-01', emissaoFinal: '2026-07-31' },
      CONFIG,
      { prisma, fetchImpl },
    );

    const loja = summary.lojas[0];
    expect(loja?.ok).toBe(true);
    if (loja?.ok) {
      expect(loja.notasLidas).toBe(2);
      expect(loja.notasIgnoradas).toBe(1);
      expect(loja.linhasInseridas).toBe(1);
    }
  });
});
