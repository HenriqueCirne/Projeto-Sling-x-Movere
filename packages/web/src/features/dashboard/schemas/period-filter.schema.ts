import { z } from 'zod';

import type { PeriodFilter } from '../dashboard.contract';

/**
 * Validação do filtro de período vindo da URL (`?dataInicial=&dataFinal=`).
 *
 * Entrada não confiável (query string) — datas em formato `YYYY-MM-DD`
 * (padrão de `<input type="date">`). Ambas opcionais; quando as duas estão
 * presentes, `dataInicial` não pode ser depois de `dataFinal` (intervalo
 * invertido não tem leitura sensata e a UI não deve fingir que tem).
 */
export const periodFilterInputSchema = z
  .object({
    dataInicial: z.iso.date().optional(),
    dataFinal: z.iso.date().optional(),
  })
  .refine(
    (value) => !value.dataInicial || !value.dataFinal || value.dataInicial <= value.dataFinal,
    { error: 'A data inicial não pode ser depois da data final.', path: ['dataInicial'] },
  );

export type PeriodFilterInput = z.infer<typeof periodFilterInputSchema>;

/**
 * Converte o input validado (datas `YYYY-MM-DD`, sem hora) em limites de
 * `Date` para a query — `dataFinal` vira o ÚLTIMO instante do dia, não a
 * meia-noite. Sem isso, filtrar "até 2026-08-31" excluiria todos os
 * lançamentos daquele dia exceto os gravados exatamente à meia-noite — um
 * bug de off-by-one-day clássico em filtro de data inclusivo.
 *
 * `Z` (UTC) explícito nas duas pontas: a data de um lançamento do ERP é um
 * dia de calendário, não um instante fuso-dependente — fixar UTC evita que o
 * fuso horário do servidor mova a fronteira do dia.
 */
export function toPeriodFilter(input: PeriodFilterInput): PeriodFilter {
  return {
    dataInicial: input.dataInicial ? new Date(`${input.dataInicial}T00:00:00.000Z`) : undefined,
    dataFinal: input.dataFinal ? new Date(`${input.dataFinal}T23:59:59.999Z`) : undefined,
  };
}
