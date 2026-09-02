import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

import {
  SalesImportError,
  importSalesEntries,
} from '../packages/web/src/features/sales-import';

/**
 * Converte o worksheet do exceljs em array-of-arrays (linha 1 = cabeçalho),
 * o formato que `parseWorkbook` espera.
 *
 * O export do ERP não usa fórmulas/rich text/hyperlink — célula com um desses
 * formatos vira um objeto que os parsers de campo rejeitam com uma mensagem
 * clara (`"valor inesperado para texto: ..."`), então não há necessidade de
 * normalizá-los aqui.
 *
 * `includeEmpty: true` em `eachRow`/`eachCell` degrada catastroficamente em
 * planilhas grandes no exceljs (uma linha por vez ficou impraticável em
 * 23,7k linhas). Sem essa opção, `eachRow` pula linha totalmente em branco em
 * vez de chamar o callback — por isso indexa por `row.number` (número real da
 * planilha) em vez de por ordem de chegada, e preenche qualquer buraco
 * depois, para a numeração de linha não desalinhar.
 */
function worksheetToRows(worksheet: ExcelJS.Worksheet): unknown[][] {
  const rows: unknown[][] = [];

  worksheet.eachRow((row) => {
    const values = row.values as unknown[]; // 1-indexado; values[0] não é usado
    const rowArray: unknown[] = new Array(worksheet.columnCount).fill(null);
    for (let i = 1; i < values.length; i++) {
      const value = values[i];
      rowArray[i - 1] = value === undefined ? null : value;
    }
    rows[row.number - 1] = rowArray;
  });

  for (let i = 0; i < rows.length; i++) {
    if (!rows[i]) rows[i] = new Array(worksheet.columnCount).fill(null);
  }

  return rows;
}

/**
 * Importação de planilha de vendas para `sales_entries` (TD-07).
 *
 * Uso:
 *   npm run db:import -- "DOC/AGO.27.26-Planilha Dashboard.xlsx"
 *
 * Substitui, de forma idempotente, a janela de datas coberta pelas linhas da
 * planilha (TD-04b/TD-07) — rodar de novo com a mesma planilha (ou uma
 * atualizada, cobrindo a mesma janela) não duplica nada.
 *
 * A lógica mora em `features/sales-import` (dentro de `packages/web`) e não
 * aqui, mesmo motivo do `seed.ts`: coberta pelo Vitest, e este arquivo fica
 * só sendo o ponto de entrada de CLI. Lê com `exceljs` (não `xlsx`/SheetJS: a
 * versão publicada no npm tem duas vulnerabilidades HIGH sem correção —
 * prototype pollution e ReDoS — e a versão corrigida só é distribuída pelo
 * CDN próprio da SheetJS, fora do registro npm).
 */
async function main(): Promise<void> {
  const filePath = process.argv[2];

  if (!filePath) {
    console.error('[import] Uso: npm run db:import -- "<caminho da planilha .xlsx>"');
    process.exitCode = 1;
    return;
  }

  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(filePath);
  const worksheet = workbook.worksheets[0];

  if (!worksheet) {
    console.error('[import] A planilha não tem nenhuma aba.');
    process.exitCode = 1;
    return;
  }

  const rawRows = worksheetToRows(worksheet);

  console.log(`[import] planilha: ${filePath}`);
  console.log(`[import] aba: ${worksheet.name} (${rawRows.length - 1} linha(s) de dado)`);

  const prisma = new PrismaClient();

  try {
    const summary = await importSalesEntries(rawRows, prisma);

    console.log(`[import] linhas lidas: ${summary.totalRows}`);
    console.log(`[import] linhas válidas: ${summary.validRows}`);
    console.log(`[import] linhas rejeitadas: ${summary.rejectedRows}`);

    if (summary.rejected.length > 0) {
      console.log('[import] amostra de rejeições (até 20):');
      for (const rejection of summary.rejected.slice(0, 20)) {
        console.log(`  linha ${rejection.row}: ${rejection.reason}`);
      }
    }

    if (summary.dateRange) {
      const min = summary.dateRange.min.toISOString().slice(0, 10);
      const max = summary.dateRange.max.toISOString().slice(0, 10);
      console.log(`[import] janela substituída: ${min} a ${max}`);
    }

    console.log(`[import] linhas apagadas na janela: ${summary.deletedCount}`);
    console.log(`[import] linhas inseridas: ${summary.insertedCount}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  if (error instanceof SalesImportError) {
    // Erro de dado/planilha é do operador, não um defeito: mensagem limpa,
    // sem stack trace (mesmo padrão de SeedConfigurationError em seed.ts).
    console.error(`[import] ${error.message}`);
  } else {
    console.error('[import] falha ao importar a planilha:', error);
  }
  process.exitCode = 1;
});
