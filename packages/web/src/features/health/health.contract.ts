/**
 * API pública da feature `health`.
 *
 * Outras features dependem SOMENTE deste contrato, nunca da implementação
 * (Contract Pattern do preset `nextjs-react`).
 */

/** Situação geral da aplicação. */
export type HealthStatus = 'ok' | 'degraded';

/**
 * Situação da dependência de banco de dados.
 * - `connected`      → conexão estabelecida e query de sondagem respondida
 * - `disconnected`   → `DATABASE_URL` definida, mas o banco não respondeu
 * - `not_configured` → `DATABASE_URL` ausente no ambiente
 */
export type DatabaseStatus = 'connected' | 'disconnected' | 'not_configured';

export type DatabaseHealth = {
  status: DatabaseStatus;
  /** Mensagem segura para exibição — nunca contém a connection string. */
  message: string;
  /** Latência da query de sondagem em ms; `null` quando não houve conexão. */
  latencyMs: number | null;
};

export type HealthReport = {
  status: HealthStatus;
  application: {
    name: string;
    environment: string;
    checkedAt: string;
  };
  database: DatabaseHealth;
};

export interface HealthContract {
  /**
   * Coleta o estado atual da aplicação e de suas dependências.
   *
   * Não lança: qualquer falha de dependência é traduzida em um `HealthReport`
   * com `status: 'degraded'`. Um health-check que quebra não informa nada.
   */
  getHealth(): Promise<HealthReport>;
}
