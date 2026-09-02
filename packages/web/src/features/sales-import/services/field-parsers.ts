/**
 * Parsers puros de célula de planilha → valor tipado (AC de importação, TD-07).
 *
 * Cada parser lida com o valor bruto que o SheetJS entrega (`string | number |
 * Date | null | undefined`) e nunca lança — erros viram `{ ok: false }` para o
 * chamador decidir se rejeita a linha ou aborta a importação inteira.
 */

export type ParseResult<T> = { ok: true; value: T } | { ok: false; error: string };

function ok<T>(value: T): ParseResult<T> {
  return { ok: true, value };
}

function fail(error: string): ParseResult<never> {
  return { ok: false, error };
}

function isBlank(raw: unknown): boolean {
  return raw === null || raw === undefined || (typeof raw === 'string' && raw.trim().length === 0);
}

/** Texto opcional (dimensões como Loja, Cliente, Item). Célula em branco vira `null`. */
export function parseNullableString(raw: unknown): ParseResult<string | null> {
  if (isBlank(raw)) return ok(null);
  if (typeof raw === 'string') return ok(raw.trim());
  if (typeof raw === 'number') return ok(String(raw));
  return fail(`valor inesperado para texto: ${JSON.stringify(raw)}`);
}

const TIPO_ALIASES: Record<string, 'VENDA' | 'DEVOLUCAO'> = {
  venda: 'VENDA',
  devolução: 'DEVOLUCAO',
  devolucao: 'DEVOLUCAO',
};

/** "Tipo" (col. A) — só os dois valores observados nos dados reais (TD-04, Achado 4). */
export function parseTipo(raw: unknown): ParseResult<'VENDA' | 'DEVOLUCAO'> {
  if (typeof raw !== 'string' || raw.trim().length === 0) {
    return fail(`"Tipo" ausente: ${JSON.stringify(raw)}`);
  }
  const normalized = raw.trim().toLowerCase();
  const mapped = TIPO_ALIASES[normalized];
  if (!mapped) {
    return fail(`"Tipo" com valor não reconhecido: "${raw}" (esperado "Venda" ou "Devolução")`);
  }
  return ok(mapped);
}

const EXCEL_EPOCH_MS = Date.UTC(1899, 11, 30);
const MS_PER_DAY = 86_400_000;

/**
 * "Data de Emissão" (col. V). Nos dois exports de referência (TD-04, TD-07)
 * vem como texto `dd/mm/aaaa` — mas também aceita `Date`/serial numérico do
 * Excel, caso um export futuro use célula de data de verdade.
 */
export function parseDataEmissao(raw: unknown): ParseResult<Date> {
  if (raw instanceof Date) {
    if (Number.isNaN(raw.getTime())) return fail('"Data de Emissão" é uma data inválida');
    return ok(new Date(Date.UTC(raw.getFullYear(), raw.getMonth(), raw.getDate())));
  }

  if (typeof raw === 'number' && Number.isFinite(raw)) {
    return ok(new Date(EXCEL_EPOCH_MS + raw * MS_PER_DAY));
  }

  if (typeof raw === 'string') {
    const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.exec(raw.trim());
    if (!match) return fail(`"Data de Emissão" fora do formato dd/mm/aaaa: "${raw}"`);
    const [, dayStr, monthStr, yearStr] = match as unknown as [string, string, string, string];
    const day = Number(dayStr);
    const month = Number(monthStr);
    const year = Number(yearStr);
    const date = new Date(Date.UTC(year, month - 1, day));
    if (
      date.getUTCFullYear() !== year ||
      date.getUTCMonth() !== month - 1 ||
      date.getUTCDate() !== day
    ) {
      return fail(`"Data de Emissão" não é uma data real: "${raw}"`);
    }
    return ok(date);
  }

  return fail(`"Data de Emissão" ausente ou em formato não suportado: ${JSON.stringify(raw)}`);
}

/**
 * Campo monetário/quantidade obrigatório → string decimal (nunca `number`,
 * TD-02: `Decimal`/`numeric`, nunca `float`). Aceita número (caminho comum,
 * célula numérica do Excel) ou texto — tenta primeiro como número puro
 * (`"1550.00"`), e só então como formato PT-BR de milhar/decimal
 * (`"1.550,00"`), já que os exports de referência não usam esse formato mas
 * uma célula "texto" digitada manualmente poderia.
 */
export function parseDecimal(
  raw: unknown,
  fieldLabel: string,
  fractionDigits: number,
): ParseResult<string> {
  if (isBlank(raw)) return fail(`"${fieldLabel}" ausente ou vazio`);

  let n: number;
  if (typeof raw === 'number') {
    n = raw;
  } else {
    const asIs = Number(raw);
    n = Number.isFinite(asIs)
      ? asIs
      : Number(String(raw).trim().replace(/\./g, '').replace(',', '.'));
  }

  if (!Number.isFinite(n)) {
    return fail(`"${fieldLabel}" não é um número válido: ${JSON.stringify(raw)}`);
  }
  return ok(n.toFixed(fractionDigits));
}

/** Igual a {@link parseDecimal}, mas em branco é um `null` válido (ex: "Preço"). */
export function parseDecimalNullable(
  raw: unknown,
  fieldLabel: string,
  fractionDigits: number,
): ParseResult<string | null> {
  if (isBlank(raw)) return ok(null);
  return parseDecimal(raw, fieldLabel, fractionDigits);
}
