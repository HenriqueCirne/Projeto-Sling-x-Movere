/**
 * Contrato público da feature `erp-sync` (Story 1.4, TD-03/Achado 8).
 *
 * ⚠️ Módulo compartilhado com `prisma/sync-moveres.ts`: só pode importar de
 * `node_modules` ou por caminho relativo — nada de alias `@/...`, nada de
 * `next/*` (mesma regra de `features/auth/services/seed-admin.service.ts`).
 *
 * Racional completo: `docs/architecture/api-moveres-contract-spike.md`
 * (Achado 8) e `docs/architecture/tech-decisions.md` (TD-03).
 */

/** Erro de comunicação/autenticação com a API Moveres — mensagem segura para log. */
export class MoveresApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MoveresApiError';
  }
}

/** Resultado da sincronização de UMA loja. */
export type LojaSyncResult =
  | {
      ok: true;
      codigoLoja: number;
      nomeLoja: string;
      notasLidas: number;
      notasIgnoradas: number;
      linhasInseridas: number;
      linhasApagadas: number;
    }
  | {
      ok: false;
      codigoLoja: number;
      nomeLoja: string;
      error: string;
    };

/** Resultado agregado de uma execução completa do sync (todas as lojas). */
export type SyncSummary = {
  emissaoInicial: string;
  emissaoFinal: string;
  lojas: LojaSyncResult[];
};
