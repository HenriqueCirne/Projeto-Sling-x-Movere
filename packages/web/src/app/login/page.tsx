import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

import { auth, sanitizeCallbackUrl } from '@/features/auth';
import { LoginForm } from '@/features/auth/components/LoginForm';

export const metadata: Metadata = {
  title: 'Entrar — Movimento Gerais',
};

/**
 * Tela de login (AC1).
 *
 * É a única rota pública da área autenticada. Quem já tem sessão válida é
 * mandado direto ao destino — voltar ao formulário estando logado só produz
 * confusão.
 */
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  const rawCallbackUrl = params.callbackUrl;
  const callbackUrl = sanitizeCallbackUrl(
    typeof rawCallbackUrl === 'string' ? rawCallbackUrl : undefined,
  );

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <section className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <header className="mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
            Movimento Gerais
          </h1>
          <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
            Acesso restrito à gestão da Cirne Pneus.
          </p>
        </header>

        <LoginForm callbackUrl={callbackUrl} />
      </section>
    </main>
  );
}
