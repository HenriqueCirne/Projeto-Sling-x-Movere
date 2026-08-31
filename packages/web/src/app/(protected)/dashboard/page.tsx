import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Painel — Movimento Gerais',
};

/**
 * Área autenticada (AC2, AC4).
 *
 * Placeholder deliberado: o conteúdo do Painel é escopo da Story 1.5. O que esta
 * página entrega hoje é a rota protegida contra a qual o redirecionamento do
 * AC2 e a persistência de sessão do AC4 são verificáveis.
 */
export default function DashboardPage() {
  return (
    <main className="flex flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <section className="w-full max-w-xl rounded-xl border border-zinc-200 bg-white p-8 text-center shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-50">
          Painel
        </h1>
        <p className="mt-2 text-sm text-zinc-500 dark:text-zinc-400">
          Sessão ativa. Os relatórios comerciais chegam na Story 1.5.
        </p>
      </section>
    </main>
  );
}
