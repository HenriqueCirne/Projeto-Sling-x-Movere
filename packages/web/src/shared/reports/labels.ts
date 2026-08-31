/**
 * Rótulo para dimensões descritivas ausentes (`familia`, `grupo`, `item`,
 * `condicaoPagamento`, `atendente`, ... — todos nullable no schema da Story
 * 1.3, TD-03: cobertura de campos da API não validada). Uma linha com o
 * campo ausente é agrupada sob este rótulo, nunca descartada silenciosamente
 * do relatório — descartar mudaria os totais sem aviso.
 */
export const NAO_INFORMADO = 'Não informado';

export function labelOrNaoInformado(value: string | null): string {
  return value ?? NAO_INFORMADO;
}
