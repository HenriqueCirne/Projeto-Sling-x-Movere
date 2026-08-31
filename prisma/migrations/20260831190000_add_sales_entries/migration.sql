-- Story 1.3 — tabela de lançamentos de venda (espelho do ERP, TD-04).
--
-- Gerada por `prisma migrate diff --from-schema-datamodel --to-schema-datamodel`
-- (schema-a-schema, sem exigir shadow database — Docker ausente nesta máquina,
-- mesma limitação L1 das Stories 1.1/1.2) comparando o schema imediatamente
-- anterior (commit 7f4c290, só os modelos de auth da Story 1.2) contra o
-- schema atual. As migrações anteriores (`0_init`, `add_auth_models`) não
-- foram alteradas — histórico de migrações é append-only.

-- CreateEnum
CREATE TYPE "sales_entry_type" AS ENUM ('VENDA', 'DEVOLUCAO');

-- CreateTable
CREATE TABLE "sales_entries" (
    "id" TEXT NOT NULL,
    "id_lancamento" TEXT,
    "numero_documento" TEXT,
    "tipo" "sales_entry_type" NOT NULL DEFAULT 'VENDA',
    "data_emissao" TIMESTAMP(3) NOT NULL,
    "loja" TEXT,
    "cliente" TEXT,
    "atendente" TEXT,
    "item" TEXT,
    "familia" TEXT,
    "grupo" TEXT,
    "marca" TEXT,
    "linha" TEXT,
    "tipo_preco" TEXT,
    "condicao_pagamento" TEXT,
    "preco" DECIMAL(14,2),
    "valor_total" DECIMAL(14,2) NOT NULL,
    "quantidade" DECIMAL(12,3) NOT NULL,
    "prazo_medio" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sales_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "sales_entries_data_emissao_idx" ON "sales_entries"("data_emissao");

-- CreateIndex
CREATE INDEX "sales_entries_loja_idx" ON "sales_entries"("loja");

-- CreateIndex
CREATE INDEX "sales_entries_cliente_idx" ON "sales_entries"("cliente");

-- CreateIndex
CREATE INDEX "sales_entries_atendente_idx" ON "sales_entries"("atendente");

-- CreateIndex
CREATE INDEX "sales_entries_data_emissao_loja_idx" ON "sales_entries"("data_emissao", "loja");
