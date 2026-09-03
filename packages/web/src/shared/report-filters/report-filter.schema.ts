import { z } from 'zod';

import type { ReportFilter } from './report-filter.contract';

/**
 * Validação do filtro de período+loja vindo da URL
 * (`?dataInicial=&dataFinal=&loja=`). Movido de `features/dashboard`
 * (Story 1.5) para `shared/` na Story 2.1 — ver `report-filter.contract.ts`.
 */
export const reportFilterInputSchema = z
  .object({
    dataInicial: z.iso.date().optional(),
    dataFinal: z.iso.date().optional(),
    loja: z.string().trim().min(1).optional(),
    marca: z.string().trim().min(1).optional(),
    grupo: z.string().trim().min(1).optional(),
    familia: z.string().trim().min(1).optional(),
    linha: z.string().trim().min(1).optional(),
    tipoPreco: z.string().trim().min(1).optional(),
  })
  .refine(
    (value) => !value.dataInicial || !value.dataFinal || value.dataInicial <= value.dataFinal,
    { error: 'A data inicial não pode ser depois da data final.', path: ['dataInicial'] },
  );

export type ReportFilterInput = z.infer<typeof reportFilterInputSchema>;

/**
 * Converte o input validado em limites de `Date` para a query —
 * `dataFinal` vira o ÚLTIMO instante do dia (ver Story 1.5 — sem isso,
 * filtrar "até 2026-08-31" excluiria os lançamentos do próprio dia 31).
 */
export function toReportFilter(input: ReportFilterInput): ReportFilter {
  return {
    dataInicial: input.dataInicial ? new Date(`${input.dataInicial}T00:00:00.000Z`) : undefined,
    dataFinal: input.dataFinal ? new Date(`${input.dataFinal}T23:59:59.999Z`) : undefined,
    loja: input.loja,
    marca: input.marca,
    grupo: input.grupo,
    familia: input.familia,
    linha: input.linha,
    tipoPreco: input.tipoPreco,
  };
}
