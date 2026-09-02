/**
 * Fachada da feature `sales-import`.
 *
 * ⚠️ Compartilhada com `prisma/import-sales-entries.ts` (roda fora do
 * Next.js, via `tsx`): só reexporta módulos que não dependem de `@/...` nem
 * de `next/*` (mesma regra de `features/auth/index.ts` e `seed-admin.service.ts`).
 */
export {
  SalesImportError,
  type ImportSummary,
  type ParsedSalesEntryRow,
  type RowRejection,
} from './sales-import.contract';
export { importSalesEntries, type ImportPrismaClient } from './services/import-sales-entries.service';
