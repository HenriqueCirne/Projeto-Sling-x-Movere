import { describe, expect, it } from 'vitest';

import { labelOrNaoInformado, NAO_INFORMADO } from './labels';

describe('labelOrNaoInformado', () => {
  it('devolve o rótulo "Não informado" quando o valor é nulo', () => {
    expect(labelOrNaoInformado(null)).toBe(NAO_INFORMADO);
  });

  it('devolve o valor original quando presente', () => {
    expect(labelOrNaoInformado('Pneus')).toBe('Pneus');
  });
});
