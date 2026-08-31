import { logoutAction } from '../actions/logout.action';

/**
 * Botão de logout (Task 4).
 *
 * É um `<form>` com Server Action, e não um `onClick`: funciona sem JavaScript,
 * não precisa virar Client Component e o POST evita que um GET pré-carregado
 * (por um prefetch ou um scanner de link) derrube a sessão do gestor.
 */
export function SignOutButton() {
  return (
    <form action={logoutAction}>
      <button
        type="submit"
        className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        Sair
      </button>
    </form>
  );
}
