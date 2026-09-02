import type { ReactNode } from 'react';

import { AppNav } from '@/shared/components/AppNav';

/**
 * Layout compartilhado do Painel e dos relatórios (branding + navegação).
 *
 * **Sem checagem de sessão de propósito.** Decisão explícita do stakeholder em
 * 2026-09-01: acesso sem login, sobrepondo a NFR3 original do PRD ("não deve
 * haver acesso público ou anônimo") — ver
 * `docs/architecture/tech-decisions.md#TD-06` para o racional completo e como
 * reverter, se um dia for necessário. Este grupo de rotas chamava-se
 * `(protected)`; renomeado para `(app)` porque não protege mais nada — manter
 * o nome antigo seria enganoso para quem ler o código depois.
 */
export default function AppLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Movimento Gerais</p>
        <AppNav />
      </header>

      {children}
    </div>
  );
}
