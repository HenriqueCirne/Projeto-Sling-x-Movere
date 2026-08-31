import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';

import { auth, LOGIN_PATH } from '@/features/auth';
import { SignOutButton } from '@/features/auth/components/SignOutButton';

/**
 * Portão de autorização da área autenticada (AC2).
 *
 * **Esta é a checagem autoritativa**, não o `src/proxy.ts`: `auth()` resolve a
 * sessão consultando a tabela `sessions` (TD-01, sessão em banco). Um cookie
 * revogado no banco não passa daqui, mesmo tendo passado pelo proxy.
 *
 * Toda rota colocada sob `app/(protected)/` herda este portão. O grupo de rotas
 * `(protected)` não aparece na URL — `/dashboard` continua sendo `/dashboard`.
 */
export default async function ProtectedLayout({ children }: Readonly<{ children: ReactNode }>) {
  const session = await auth();

  if (!session?.user) {
    // Sem `callbackUrl` de propósito: o proxy já preserva a intenção original
    // no caminho comum. Chegar aqui significa cookie presente mas sessão morta
    // (revogada ou expirada) — o destino relevante é a tela de login.
    redirect(LOGIN_PATH);
  }

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-6 py-4 dark:border-zinc-800 dark:bg-zinc-900">
        <div>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Movimento Gerais</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">{session.user.email}</p>
        </div>
        <SignOutButton />
      </header>

      {children}
    </div>
  );
}
