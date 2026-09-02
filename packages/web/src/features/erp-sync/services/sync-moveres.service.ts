import { replaceSalesEntriesWindow } from '../../../shared/sales-entries/replace-window.repository';
import type { SalesEntriesPrismaClient } from '../../../shared/sales-entries/replace-window.repository';
import type { LojaSyncResult, SyncSummary } from '../erp-sync.contract';
import { mapNotaToSalesEntries } from './map-nota-to-sales-entries';
import {
  fetchEstabelecimentos,
  fetchNotasFiscaisPaginado,
  fetchTiposDePrecos,
  loginMoveres,
  type Estabelecimento,
  type MoveresConfig,
} from './movere-client';
import { notasFiscaisResponseSchema } from './nota-fiscal.schema';

export type SyncMoveresDeps = {
  prisma: SalesEntriesPrismaClient;
  fetchImpl?: typeof fetch;
  /** Progresso loja a loja, para o CLI logar em tempo real (AC3) — opcional para não acoplar testes a I/O. */
  onLojaResult?: (result: LojaSyncResult) => void;
};

export type SyncMoveresParams = {
  emissaoInicial: string;
  emissaoFinal: string;
};

async function syncLoja(
  estabelecimento: Estabelecimento,
  params: SyncMoveresParams,
  config: MoveresConfig,
  token: string,
  tipoPrecoPorCodigo: ReadonlyMap<number, string>,
  deps: SyncMoveresDeps,
): Promise<LojaSyncResult> {
  const { codigoEstabelecimento, nome } = estabelecimento;

  try {
    const notasRaw = await fetchNotasFiscaisPaginado(
      config,
      token,
      { codigoLoja: codigoEstabelecimento, ...params },
      deps.fetchImpl,
    );

    const notas = notasFiscaisResponseSchema.parse(notasRaw);

    let notasIgnoradas = 0;
    const rows = notas.flatMap((wrapper) => {
      const notaRows = mapNotaToSalesEntries(wrapper.NF, { loja: nome, tipoPrecoPorCodigo });
      if (notaRows.length === 0) notasIgnoradas++;
      return notaRows;
    });

    if (rows.length === 0) {
      return {
        ok: true,
        codigoLoja: codigoEstabelecimento,
        nomeLoja: nome,
        notasLidas: notas.length,
        notasIgnoradas,
        linhasInseridas: 0,
        linhasApagadas: 0,
      };
    }

    const { deletedCount, insertedCount } = await replaceSalesEntriesWindow(rows, deps.prisma, {
      loja: nome,
    });

    return {
      ok: true,
      codigoLoja: codigoEstabelecimento,
      nomeLoja: nome,
      notasLidas: notas.length,
      notasIgnoradas,
      linhasInseridas: insertedCount,
      linhasApagadas: deletedCount,
    };
  } catch (error) {
    return {
      ok: false,
      codigoLoja: codigoEstabelecimento,
      nomeLoja: nome,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Sincroniza `sales_entries` com a API Moveres para todas as lojas ativas,
 * numa janela de datas — Story 1.4, AC1/AC2/AC4/AC5.
 *
 * Uma loja por vez, com a falha de uma loja isolada das demais (AC5): a API
 * exige `codigoLoja` por chamada, então já é natural tratar cada loja como
 * uma unidade independente. Cada loja substitui só a própria janela
 * (Data de Emissão + Loja, TD-04b) — não afeta os dados de outras lojas nem
 * de uma importação de planilha anterior fora dessa janela.
 *
 * Não lança para falha de uma loja individual — cada `LojaSyncResult` carrega
 * seu próprio sucesso/erro. Só lança se o login ou os catálogos (usados por
 * todas as lojas) falharem, já que aí nenhuma loja pode ser processada.
 */
export async function syncMoveres(
  params: SyncMoveresParams,
  config: MoveresConfig,
  deps: SyncMoveresDeps,
): Promise<SyncSummary> {
  const session = await loginMoveres(config, deps.fetchImpl);

  const [estabelecimentos, tiposDePreco] = await Promise.all([
    fetchEstabelecimentos(config, session.token, deps.fetchImpl),
    fetchTiposDePrecos(config, session.token, deps.fetchImpl),
  ]);

  const tipoPrecoPorCodigo = new Map(
    tiposDePreco.map((tipo) => [tipo.codigoTipoPreco, tipo.nome]),
  );

  const lojas: LojaSyncResult[] = [];
  for (const estabelecimento of estabelecimentos.filter((e) => e.ativo)) {
    const result = await syncLoja(
      estabelecimento,
      params,
      config,
      session.token,
      tipoPrecoPorCodigo,
      deps,
    );
    lojas.push(result);
    deps.onLojaResult?.(result);
  }

  return { emissaoInicial: params.emissaoInicial, emissaoFinal: params.emissaoFinal, lojas };
}
