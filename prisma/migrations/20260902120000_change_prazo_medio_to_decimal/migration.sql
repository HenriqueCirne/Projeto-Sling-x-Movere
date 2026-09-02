-- Ver prisma/schema.prisma (SalesEntry.prazoMedio) para o racional: TD-04
-- assumiu "Prazo Médio" inteiro a partir de amostra pequena; a importação
-- real (TD-07, 2026-09-02) mostrou prazo fracionário na maioria das linhas
-- (ex: 105.17, 45.5), rejeitando 46% das linhas reais sob INTEGER.
--
-- Gerada por `prisma migrate diff --from-url <DATABASE_URL> --to-schema-datamodel prisma/schema.prisma --script`
-- (`migrate dev` não roda neste ambiente não-interativo).

-- AlterTable
ALTER TABLE "sales_entries" ALTER COLUMN "prazo_medio" SET DATA TYPE DECIMAL(8,2);
