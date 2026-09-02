/**
 * Fachada da feature `erp-sync` (Story 1.4).
 *
 * ⚠️ Compartilhada com `prisma/sync-moveres.ts` (roda fora do Next.js, via
 * `tsx`): só reexporta módulos que não dependem de `@/...` nem de `next/*`
 * (mesma regra de `features/auth/index.ts` e `features/sales-import/index.ts`).
 */
export {
  MoveresApiError,
  type LojaSyncResult,
  type SyncSummary,
} from './erp-sync.contract';
export type { MoveresConfig } from './services/movere-client';
export {
  syncMoveres,
  type SyncMoveresDeps,
  type SyncMoveresParams,
} from './services/sync-moveres.service';
