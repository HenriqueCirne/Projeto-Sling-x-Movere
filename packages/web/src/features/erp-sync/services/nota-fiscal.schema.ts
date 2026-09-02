import { z } from 'zod';

/**
 * Validação da resposta real de `GET /api/NotasFiscaisEmitidas` (Achado 8).
 *
 * ⚠️ **A casing aqui é a observada em produção, não a do Swagger.** O Swagger
 * documenta `nf`/`produtos`/`parcelas` minúsculos — a resposta real usa
 * `NF`/`Produtos`/`Parcelas` maiúsculos. Foi exatamente essa divergência,
 * verificada só no nível raiz (`NF`/`nf`, Achado 3) e não nos níveis
 * aninhados, que causou o bloqueio fantasma do Achado 4 — retratado no
 * Achado 8. Todo campo abaixo foi confirmado contra uma resposta real.
 *
 * `.passthrough()` em todo objeto: só valida os campos que este projeto usa,
 * sem tentar modelar o payload inteiro (Impostos, Frete, Veiculo, NFe,
 * Cancelamento, etc. — não usados por nenhum relatório da Epic 1/2/3).
 */

const produtoSchema = z
  .object({
    codigo: z.number(),
    descricao: z.string(),
    quantidade: z.number(),
    precounitario: z.number(),
    valortotalitem: z.number(),
  })
  .passthrough();

const parcelaSchema = z
  .object({
    dtavencto: z.string(),
    valordocumento: z.number(),
  })
  .passthrough();

const comercialSchema = z
  .object({
    idvendedor: z.number().optional(),
    nomevendedor: z.string().optional(),
    tipopreco: z.number().optional(),
  })
  .passthrough();

const clienteSchema = z
  .object({
    nome: z.string().optional(),
  })
  .passthrough();

const nfSchema = z
  .object({
    idnotafiscal: z.number(),
    idtransacao: z.number().optional(),
    dtaemissao: z.string(),
    valortotalnota: z.number(),
    identradasaida: z.number(),
    descricaoentradaesaida: z.string(),
    idtipoentradasaida: z.number(),
    Comercial: comercialSchema.optional(),
    Cliente: clienteSchema.optional(),
    Produtos: z.array(produtoSchema).optional(),
    Parcelas: z.array(parcelaSchema).optional(),
  })
  .passthrough();

const notaWrapperSchema = z
  .object({
    NF: nfSchema,
  })
  .passthrough();

export const notasFiscaisResponseSchema = z.array(notaWrapperSchema);

export type Produto = z.infer<typeof produtoSchema>;
export type Parcela = z.infer<typeof parcelaSchema>;
export type NotaFiscal = z.infer<typeof nfSchema>;
