-- Migração inicial (baseline) — Story 1.1
--
-- Intencionalmente sem DDL: esta migração apenas estabelece o histórico de
-- migrações e fixa o provider (postgresql) para o projeto. Nenhuma tabela de
-- negócio pertence a esta story:
--   - `sales_entries`            → Story 1.3
--   - tabelas do Auth.js/Prisma  → Story 1.2
--
-- Aplicar com: `npm run db:deploy` (ou `npm run db:migrate` em desenvolvimento).
SELECT 1;
