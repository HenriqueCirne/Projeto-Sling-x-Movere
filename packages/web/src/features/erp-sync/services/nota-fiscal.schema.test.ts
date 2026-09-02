import { describe, expect, it } from 'vitest';

import { notasFiscaisResponseSchema } from './nota-fiscal.schema';

/**
 * Fixture no formato REAL observado em produção (Achado 8, 2026-09-02) — não
 * o do Swagger. Dado de cliente/documento redigido; estrutura e nomes de
 * campo são os de verdade, é isso que este teste protege (regressão de
 * contrato, mesma recomendação do Achado 3: nunca confiar no Swagger para a
 * casing).
 */
const NOTA_REAL_REDIGIDA = {
  NF: {
    Emissor: { cnpj: '[REDACTED]', razaosocial: '[REDACTED]', idestab: 1 },
    idserie: '1',
    idnotafiscal: 49667,
    idtransacao: 1844468,
    dtalancto: '2026-07-01T00:00:00',
    dtaemissao: '2026-07-01T00:00:00',
    horaemissao: '2026-07-01T00:00:00',
    valortotalnota: 4256,
    identradasaida: 1,
    descricaoentradaesaida: 'VENDAS DE MERCADORIAS/SERVIÇOS',
    origem: 'LOJA',
    idtipoentradasaida: 2,
    observacao: '',
    Comercial: {
      montadonaloja: false,
      valortotaldescontoitens: 0,
      valordescontocorpo: 0,
      percacrescimofinanceiro: 0,
      valoracrescimofinanceiro: 0,
      valortotalnota: 4256,
      tipopreco: 1,
      percdescontovencimento: 0,
      idvendedor: 259315,
      nomevendedor: '[REDACTED]',
      idorcamento: 2581,
    },
    Impostos: {},
    Frete: {},
    Cliente: { idclifor: 1, nome: '[REDACTED]', cnpjcpf: '[REDACTED]' },
    Produtos: [
      {
        codigo: 5131813,
        descricao: 'P 225/75R16C 10L 118/116R H-188',
        codFabricacao: '299',
        quantidade: 2,
        precounitario: 2128,
        precotabela: 2128,
        custocompra: 2128,
        custoreposicao: 2128,
        valortotalitem: 4256,
      },
    ],
    Parcelas: [
      {
        iddocumento: '28018',
        idparcela: 1,
        sequencianoportador: 1,
        idserie: '1',
        idestab: 1,
        dtalancto: '2026-07-01T00:00:00',
        dtaemissao: '2026-07-01T00:00:00',
        dtavencto: '2026-07-02T00:00:00',
        valordocumento: 216.98,
        valorsaldoreceber: 0,
        nossonumero: '[REDACTED]',
        valorabatimento: 0,
        valormoradiaria: 0.36,
        idsituacaotitulo: 4,
        idtipodocumento: 1,
        idtransacao: 1844468,
        idportadororiginal: 66,
        idportador: 66,
      },
    ],
    Veiculo: {},
    NFe: {
      chaveacessonfe: '[REDACTED]',
      versaonfe: '4.0',
      tiponfe: 1,
      lotenfe: '[REDACTED]',
      protocoloautorizacaonfe: '[REDACTED]',
      dtaautorizacaonfe: '2026-07-01T00:00:00',
      digestvalueautorizacaonfe: '[REDACTED]',
      statusautorizacaonfe: 100,
      tipocontingencianfe: 0,
      motivocontingencianfe: '',
      notaconfirmadacontingencianfe: false,
      XMLNFE: '[REDACTED]',
    },
  },
};

describe('notasFiscaisResponseSchema', () => {
  it('valida um array de notas no formato real (casing maiúsculo dos campos aninhados)', () => {
    const result = notasFiscaisResponseSchema.safeParse([NOTA_REAL_REDIGIDA]);
    expect(result.success).toBe(true);
  });

  it('extrai Produtos/Parcelas corretamente (a regressão que o Achado 8 corrigiu)', () => {
    const [parsed] = notasFiscaisResponseSchema.parse([NOTA_REAL_REDIGIDA]);
    expect(parsed?.NF.Produtos).toHaveLength(1);
    expect(parsed?.NF.Parcelas).toHaveLength(1);
    expect(parsed?.NF.Produtos?.[0]?.descricao).toBe('P 225/75R16C 10L 118/116R H-188');
  });

  it('rejeita quando um campo obrigatório usado pelo mapper está no casing errado do Swagger', () => {
    // "produtos"/"parcelas" minúsculos (Swagger) em vez de "Produtos"/"Parcelas"
    // (real) não devem ser aceitos como se fossem os campos de verdade —
    // devem simplesmente não aparecer no objeto validado, não ser confundidos.
    const comCasingDoSwagger = {
      NF: { ...NOTA_REAL_REDIGIDA.NF, produtos: NOTA_REAL_REDIGIDA.NF.Produtos, Produtos: undefined },
    };
    const parsed = notasFiscaisResponseSchema.parse([comCasingDoSwagger]);
    expect(parsed[0]?.NF.Produtos).toBeUndefined();
  });

  it('rejeita nota sem os campos obrigatórios de identificação/valor', () => {
    const result = notasFiscaisResponseSchema.safeParse([{ NF: { idnotafiscal: 1 } }]);
    expect(result.success).toBe(false);
  });
});
