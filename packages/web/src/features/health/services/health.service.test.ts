import { describe, expect, it, vi } from 'vitest';

import type { Env } from '@/config/env';

import type { DatabaseHealthRepository } from '../repositories/database-health.repository';
import { HealthService } from './health.service';

const FIXED_NOW = new Date('2026-08-27T12:00:00.000Z');

function buildEnv(overrides: Partial<Env> = {}): Env {
  return { NODE_ENV: 'test', DATABASE_URL: 'postgresql://user:pass@localhost:5432/db', ...overrides };
}

function buildService(
  repo: DatabaseHealthRepository,
  env: Env = buildEnv(),
): HealthService {
  return new HealthService(repo, () => env, () => FIXED_NOW);
}

describe('HealthService', () => {
  describe('getHealth', () => {
    it('reporta ok quando o banco responde', async () => {
      const repo: DatabaseHealthRepository = {
        ping: vi.fn().mockResolvedValue({ reachable: true, latencyMs: 12 }),
      };

      const report = await buildService(repo).getHealth();

      expect(report.status).toBe('ok');
      expect(report.database.status).toBe('connected');
      expect(report.database.latencyMs).toBe(12);
      expect(report.application).toEqual({
        name: 'Movimento Gerais',
        environment: 'test',
        checkedAt: FIXED_NOW.toISOString(),
      });
      expect(repo.ping).toHaveBeenCalledOnce();
    });

    it('reporta degraded quando DATABASE_URL está configurada mas o banco não responde', async () => {
      const repo: DatabaseHealthRepository = {
        ping: vi.fn().mockResolvedValue({ reachable: false, latencyMs: null }),
      };

      const report = await buildService(repo).getHealth();

      expect(report.status).toBe('degraded');
      expect(report.database.status).toBe('disconnected');
      expect(report.database.latencyMs).toBeNull();
    });

    it('reporta not_configured sem sequer tocar no banco quando DATABASE_URL está ausente', async () => {
      const repo: DatabaseHealthRepository = { ping: vi.fn() };

      const report = await buildService(repo, buildEnv({ DATABASE_URL: undefined })).getHealth();

      expect(report.status).toBe('degraded');
      expect(report.database.status).toBe('not_configured');
      expect(repo.ping).not.toHaveBeenCalled();
    });

    it('nunca expõe a connection string nas mensagens do relatório', async () => {
      const repo: DatabaseHealthRepository = {
        ping: vi.fn().mockResolvedValue({ reachable: false, latencyMs: null }),
      };

      const report = await buildService(repo).getHealth();

      expect(JSON.stringify(report)).not.toContain('postgresql://');
      expect(JSON.stringify(report)).not.toContain('pass');
    });
  });
});
