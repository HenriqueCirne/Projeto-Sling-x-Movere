/**
 * API pública da feature `auth` (Contract Pattern do preset).
 *
 * Outras features dependem SOMENTE deste arquivo — nunca da implementação.
 *
 * Decisões de arquitetura: docs/architecture/tech-decisions.md#TD-01
 * (Auth.js v5, Credentials provider, argon2id, sessão em banco).
 */

/** Papéis suportados. O MVP tem apenas `GESTOR` (NFR3). */
export type UserRole = 'GESTOR';

/** Gestor autenticado, na forma mínima exposta à aplicação. */
export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
};

/**
 * Mensagem única para QUALQUER falha de credencial (AC3).
 *
 * É deliberadamente idêntica para "e-mail inexistente" e "senha errada": qualquer
 * diferença entre os dois casos transforma a tela de login em um oráculo de
 * enumeração de usuários. Se você for tentado a torná-la mais "útil", não torne.
 */
export const INVALID_CREDENTIALS_MESSAGE = 'E-mail ou senha inválidos.';

/** Resultado da tentativa de login exposto à camada de UI. */
export type LoginResult =
  | { ok: true; redirectTo: string }
  | { ok: false; message: typeof INVALID_CREDENTIALS_MESSAGE };

/**
 * Verificação de credenciais (e-mail + senha).
 *
 * Implementação: `services/credentials.service.ts`.
 */
export interface CredentialsContract {
  /**
   * Valida as credenciais informadas.
   *
   * Não lança para credencial inválida — retorna `null`. O chamador NÃO deve
   * distinguir os motivos da falha ao usuário final (ver
   * {@link INVALID_CREDENTIALS_MESSAGE}).
   *
   * @param input - Payload não confiável (vem do formulário de login).
   */
  authenticate(input: unknown): Promise<AuthenticatedUser | null>;
}

/** Rota da tela de login (pública). */
export const LOGIN_PATH = '/login';

/** Rota inicial da área autenticada. */
export const DEFAULT_AUTHENTICATED_PATH = '/dashboard';

/** Raiz das rotas de relatório (Epic 2/3) — também exige sessão. */
export const REPORTS_PATH_PREFIX = '/relatorios';

/**
 * Tempo de vida da sessão, em segundos.
 *
 * **[AUTO-DECISION]** 8 horas. O TD-01 exige "expiração razoável" sem fixar um
 * número. 8h cobre uma jornada de trabalho; combinada com
 * {@link SESSION_UPDATE_AGE_SECONDS}, é uma janela deslizante — quem está usando
 * o painel não é deslogado no meio do expediente, mas uma estação esquecida
 * ligada durante a noite não permanece autenticada até o dia seguinte.
 */
export const SESSION_MAX_AGE_SECONDS = 8 * 60 * 60;

/**
 * Intervalo mínimo entre renovações do `expires` da sessão no banco, em segundos.
 * Evita um UPDATE por requisição (o Auth.js só regrava após este intervalo).
 */
export const SESSION_UPDATE_AGE_SECONDS = 60 * 60;
