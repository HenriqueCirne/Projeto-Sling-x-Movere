import { PrismaClient } from '@prisma/client';

import { syncMoveres, type LojaSyncResult } from '../packages/web/src/features/erp-sync';

/**
 * Sincronização de `sales_entries` com a API Moveres Software (Story 1.4).
 *
 * Uso:
 *   npm run sync:moveres -- 2026-07-01 2026-08-31
 *
 * Substitui, de forma idempotente, a janela (Data de Emissão + Loja) de cada
 * loja sincronizada (TD-04b) — rodar de novo com o mesmo período não
 * duplica nada. Serve tanto para backfill inicial (período largo) quanto
 * para reforçar a sincronização diária manualmente (AC4) — o agendamento
 * automático (AC1) é responsabilidade do @devops, depois que a hospedagem
 * (R3) for decidida; ver Dev Notes da Story 1.4.
 *
 * A lógica mora em `features/erp-sync` (dentro de `packages/web`) e não
 * aqui, mesmo motivo do `seed.ts`/`import-sales-entries.ts`: coberta pelo
 * Vitest, e este arquivo fica só sendo o ponto de entrada de CLI.
 */
async function main(): Promise<void> {
  const [emissaoInicial, emissaoFinal] = process.argv.slice(2);

  if (!emissaoInicial || !emissaoFinal) {
    console.error('[sync] Uso: npm run sync:moveres -- <emissaoInicial:aaaa-mm-dd> <emissaoFinal:aaaa-mm-dd>');
    process.exitCode = 1;
    return;
  }

  const baseUrl = process.env.MOVERE_API_BASE_URL;
  const ambiente = process.env.MOVERE_API_ENVIRONMENT;
  const usuario = process.env.MOVERE_API_USER;
  const senha = process.env.MOVERE_API_PASSWORD;

  if (!baseUrl || !ambiente || !usuario || !senha) {
    console.error(
      '[sync] Variáveis MOVERE_API_BASE_URL/MOVERE_API_ENVIRONMENT/MOVERE_API_USER/MOVERE_API_PASSWORD ausentes no .env.',
    );
    process.exitCode = 1;
    return;
  }

  console.log(`[sync] período: ${emissaoInicial} a ${emissaoFinal}`);

  const prisma = new PrismaClient();

  try {
    const summary = await syncMoveres(
      { emissaoInicial, emissaoFinal },
      { baseUrl, ambiente, usuario, senha },
      {
        prisma,
        onLojaResult: (result: LojaSyncResult) => {
          if (result.ok) {
            console.log(
              `[sync] loja ${result.codigoLoja} (${result.nomeLoja}): ` +
                `${result.notasLidas} nota(s) lida(s), ${result.notasIgnoradas} ignorada(s) (não é venda confirmada), ` +
                `${result.linhasApagadas} linha(s) apagada(s), ${result.linhasInseridas} linha(s) inserida(s)`,
            );
          } else {
            console.error(`[sync] loja ${result.codigoLoja} (${result.nomeLoja}): ERRO — ${result.error}`);
          }
        },
      },
    );

    const sucesso = summary.lojas.filter((l) => l.ok).length;
    const falha = summary.lojas.length - sucesso;
    console.log(`[sync] concluído: ${sucesso} loja(s) com sucesso, ${falha} com erro.`);

    if (falha > 0) {
      process.exitCode = 1;
    }
  } catch (error) {
    // Login/catálogos falharam — nenhuma loja pôde ser processada (AC5: erro
    // isolado por loja individual já é tratado dentro de syncMoveres; isto
    // aqui é a falha "global" que impede o job inteiro de rodar).
    console.error('[sync] falha ao sincronizar com a API Moveres:', error);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error('[sync] erro inesperado:', error);
  process.exitCode = 1;
});
