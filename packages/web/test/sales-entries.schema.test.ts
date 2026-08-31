import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

/**
 * Testes estruturais do schema `sales_entries` (Story 1.3).
 *
 * Sem Docker/WSL nesta máquina (mesma limitação L1 das Stories 1.1/1.2) não há
 * Postgres real para um teste de integração de verdade (aplicar a migração,
 * inserir e consultar). Em vez de pular a AC3 silenciosamente, este arquivo lê
 * o SQL da migração gerada e o schema Prisma diretamente do disco e afirma,
 * de forma determinística, as propriedades que a story exige: todos os
 * campos da AC1 presentes, os índices da AC3 presentes, e as duas decisões de
 * arquitetura do TD-04 que são fáceis de quebrar por acidente (monetário como
 * `Decimal`/`numeric`, nunca `Float`; e nenhum `UNIQUE` em `id_lancamento`/
 * `numero_documento`, que rejeitaria a maioria das linhas reais — TD-04
 * Achado 3).
 */

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..', '..');

const migrationSql = readFileSync(
  path.join(
    repoRoot,
    'prisma/migrations/20260831190000_add_sales_entries/migration.sql',
  ),
  'utf8',
);

const schemaPrisma = readFileSync(path.join(repoRoot, 'prisma/schema.prisma'), 'utf8');

describe('migração sales_entries (AC1, AC2, AC3)', () => {
  it('cria a tabela sales_entries (AC1)', () => {
    expect(migrationSql).toMatch(/CREATE TABLE "sales_entries"/);
  });

  it('contém todos os campos exigidos pelos 8 relatórios (AC1)', () => {
    const requiredColumns = [
      'loja',
      'cliente',
      'item',
      'familia',
      'grupo',
      'marca',
      'linha',
      'atendente',
      'preco',
      'tipo_preco',
      'prazo_medio',
      'condicao_pagamento',
      'data_emissao',
      'quantidade',
      'valor_total',
      // TD-04c — campos adicionados pelo @architect, não pedidos literalmente
      // pela story, mas necessários para o Ticket Médio por venda (Achado 2)
      // e para auditoria da transação.
      'numero_documento',
      'id_lancamento',
      'tipo',
    ];

    for (const column of requiredColumns) {
      expect(migrationSql, `coluna esperada: ${column}`).toMatch(
        new RegExp(`"${column}"`),
      );
    }
  });

  it('usa Decimal (numeric), nunca float/double, para campos monetários e de quantidade (TD-02)', () => {
    expect(migrationSql).toMatch(/"preco"\s+DECIMAL\(14,2\)/);
    expect(migrationSql).toMatch(/"valor_total"\s+DECIMAL\(14,2\)\s+NOT NULL/);
    expect(migrationSql).toMatch(/"quantidade"\s+DECIMAL\(12,3\)\s+NOT NULL/);
    expect(migrationSql).not.toMatch(/FLOAT|DOUBLE PRECISION|REAL\b/i);
  });

  it('cria os índices exigidos: Data de Emissão, Loja, Cliente, Atendente (AC3)', () => {
    expect(migrationSql).toMatch(/CREATE INDEX .*ON "sales_entries"\("data_emissao"\)/);
    expect(migrationSql).toMatch(/CREATE INDEX .*ON "sales_entries"\("loja"\)/);
    expect(migrationSql).toMatch(/CREATE INDEX .*ON "sales_entries"\("cliente"\)/);
    expect(migrationSql).toMatch(/CREATE INDEX .*ON "sales_entries"\("atendente"\)/);
  });

  it('cria o índice composto (Data de Emissão + Loja) avaliado na Task 4 (NFR2)', () => {
    expect(migrationSql).toMatch(
      /CREATE INDEX .*ON "sales_entries"\("data_emissao", "loja"\)/,
    );
  });

  it('NÃO cria UNIQUE em id_lancamento nem em numero_documento (TD-04, Achado 3)', () => {
    // Nenhuma combinação de colunas do export identifica uma linha de forma
    // única (709/23.724 colidem) — um UNIQUE aqui rejeitaria a maioria das
    // linhas reais. É o anti-padrão que o TD-04b descreve explicitamente.
    expect(migrationSql).not.toMatch(/UNIQUE.*id_lancamento/i);
    expect(migrationSql).not.toMatch(/UNIQUE.*numero_documento/i);
  });

  it('não restringe valor_total a positivo — devoluções têm valor negativo (TD-04, Achado 4)', () => {
    expect(migrationSql).not.toMatch(/CHECK/i);
  });

  it('o enum sales_entry_type tem exatamente Venda e Devolução, sem valor não observado nos dados', () => {
    expect(migrationSql).toMatch(
      /CREATE TYPE "sales_entry_type" AS ENUM \('VENDA', 'DEVOLUCAO'\)/,
    );
  });

  it('o schema Prisma declara SalesEntry mapeado para sales_entries', () => {
    expect(schemaPrisma).toMatch(/model SalesEntry \{/);
    expect(schemaPrisma).toMatch(/@@map\("sales_entries"\)/);
  });
});
