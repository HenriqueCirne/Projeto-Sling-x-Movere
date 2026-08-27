import { healthService, type HealthReport } from '@/features/health';
import { StatusBadge } from '@/shared/components/StatusBadge';

/**
 * Health-check da aplicação (Story 1.1, AC3).
 *
 * `force-dynamic` é obrigatório: sem ele o Next.js pré-renderiza esta página no
 * build, o que (a) exigiria um banco de pé durante o build/CI e (b) congelaria
 * um status que precisa ser lido em tempo real.
 */
export const dynamic = 'force-dynamic';

const APP_STATUS_LABEL: Record<HealthReport['status'], string> = {
  ok: 'Operacional',
  degraded: 'Degradado',
};

const DATABASE_STATUS_LABEL: Record<HealthReport['database']['status'], string> = {
  connected: 'Conectado',
  disconnected: 'Sem resposta',
  not_configured: 'Não configurado',
};

export default async function HealthPage() {
  const health = await healthService.getHealth();
  const isHealthy = health.status === 'ok';
  const isDatabaseConnected = health.database.status === 'connected';

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <section className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
              {health.application.name}
            </h1>
            <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
              Health-check da aplicação
            </p>
          </div>
          <StatusBadge
            tone={isHealthy ? 'positive' : 'warning'}
            label={APP_STATUS_LABEL[health.status]}
          />
        </header>

        <dl className="mt-8 space-y-4 text-sm">
          <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <dt className="text-zinc-500 dark:text-zinc-400">Ambiente</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              {health.application.environment}
            </dd>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <dt className="text-zinc-500 dark:text-zinc-400">Banco de dados</dt>
            <dd>
              <StatusBadge
                tone={isDatabaseConnected ? 'positive' : 'warning'}
                label={DATABASE_STATUS_LABEL[health.database.status]}
              />
            </dd>
          </div>

          {health.database.latencyMs !== null && (
            <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
              <dt className="text-zinc-500 dark:text-zinc-400">Latência do banco</dt>
              <dd className="font-medium text-zinc-900 dark:text-zinc-100">
                {health.database.latencyMs} ms
              </dd>
            </div>
          )}

          <div className="flex items-center justify-between gap-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
            <dt className="text-zinc-500 dark:text-zinc-400">Verificado em</dt>
            <dd className="font-medium text-zinc-900 dark:text-zinc-100">
              <time dateTime={health.application.checkedAt}>{health.application.checkedAt}</time>
            </dd>
          </div>
        </dl>

        {!isDatabaseConnected && (
          <p className="mt-6 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
            {health.database.message}
          </p>
        )}
      </section>
    </main>
  );
}
