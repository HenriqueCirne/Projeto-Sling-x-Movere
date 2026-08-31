import { z } from 'zod';

/**
 * Schemas de validação da fronteira de autenticação.
 *
 * ⚠️ Assim como `services/password.service.ts`, este módulo é importado por
 * `prisma/seed.ts` e portanto só pode depender de `node_modules` — sem alias
 * `@/...`, sem `next/*`.
 */

/**
 * Tamanho mínimo da senha do gestor inicial provisionado pelo seed (AC5).
 *
 * **[AUTO-DECISION]** 12 caracteres. Nenhum documento do projeto define política
 * de senha; 12 é o piso recomendado pelo OWASP para senhas humanas sem MFA — e
 * esta conta é a única porta de entrada de um painel com dados comerciais.
 * A regra vale para o PROVISIONAMENTO, não para o login: exigir tamanho mínimo
 * no login apenas informaria ao atacante o formato das senhas válidas.
 */
export const MIN_SEED_PASSWORD_LENGTH = 12;

/**
 * Normaliza o e-mail para uso como chave de identidade.
 *
 * Login e seed DEVEM usar esta função. Sem ela, semear `Gestor@Cirne.com` e
 * logar com `gestor@cirne.com` falha com "credenciais inválidas" — um bug que
 * se manifesta como problema de senha e custa horas para diagnosticar.
 */
export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

/**
 * Credenciais do formulário de login.
 *
 * Valida apenas PRESENÇA e formato de e-mail. Regras de complexidade de senha
 * não pertencem ao login (ver {@link MIN_SEED_PASSWORD_LENGTH}).
 */
export const loginSchema = z.object({
  email: z
    .string({ error: 'Informe o e-mail.' })
    .trim()
    .toLowerCase()
    .pipe(z.email('Informe um e-mail válido.')),
  password: z.string({ error: 'Informe a senha.' }).min(1, 'Informe a senha.'),
});

export type LoginInput = z.infer<typeof loginSchema>;

/**
 * Variáveis de ambiente que provisionam o gestor inicial (AC5).
 *
 * A senha vem SEMPRE do ambiente e nunca do código — NFR4 e TD-01.
 */
export const seedAdminSchema = z.object({
  email: z
    .string({ error: 'SEED_ADMIN_EMAIL é obrigatória.' })
    .trim()
    .toLowerCase()
    .pipe(z.email('SEED_ADMIN_EMAIL não é um e-mail válido.')),
  password: z
    .string({ error: 'SEED_ADMIN_PASSWORD é obrigatória.' })
    .min(
      MIN_SEED_PASSWORD_LENGTH,
      `SEED_ADMIN_PASSWORD deve ter ao menos ${MIN_SEED_PASSWORD_LENGTH} caracteres.`,
    ),
  name: z.string().trim().min(1).optional(),
});

export type SeedAdminInput = z.infer<typeof seedAdminSchema>;
