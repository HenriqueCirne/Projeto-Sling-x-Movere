import { parseEnv, type Env } from '@/config/env';

import type { DatabaseHealth, HealthContract, HealthReport } from '../health.contract';
import {
  databaseHealthRepository,
  type DatabaseHealthRepository,
} from '../repositories/database-health.repository';

const APPLICATION_NAME = 'Movimento Gerais';

const DATABASE_MESSAGES = {
  connected: 'Conexão com o PostgreSQL estabelecida.',
  disconnected: 'DATABASE_URL configurada, mas o PostgreSQL não respondeu. Rode `npm run db:up`.',
  not_configured: 'DATABASE_URL não configurada. Copie `.env.example` para `.env` e preencha-a.',
} as const;

export class HealthService implements HealthContract {
  constructor(
    private readonly databaseRepo: DatabaseHealthRepository,
    private readonly readEnv: () => Env = parseEnv,
    private readonly now: () => Date = () => new Date(),
  ) {}

  async getHealth(): Promise<HealthReport> {
    const env = this.readEnv();
    const database = await this.checkDatabase(env);

    return {
      status: database.status === 'connected' ? 'ok' : 'degraded',
      application: {
        name: APPLICATION_NAME,
        environment: env.NODE_ENV,
        checkedAt: this.now().toISOString(),
      },
      database,
    };
  }

  private async checkDatabase(env: Env): Promise<DatabaseHealth> {
    if (!env.DATABASE_URL) {
      return {
        status: 'not_configured',
        message: DATABASE_MESSAGES.not_configured,
        latencyMs: null,
      };
    }

    const { reachable, latencyMs } = await this.databaseRepo.ping();

    return reachable
      ? { status: 'connected', message: DATABASE_MESSAGES.connected, latencyMs }
      : { status: 'disconnected', message: DATABASE_MESSAGES.disconnected, latencyMs: null };
  }
}

export const healthService = new HealthService(databaseHealthRepository);
