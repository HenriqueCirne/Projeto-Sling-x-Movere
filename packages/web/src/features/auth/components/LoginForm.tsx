'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

import { loginAction } from '../actions/login.action';
import { loginSchema } from '../schemas/credentials.schema';

type LoginFormValues = z.input<typeof loginSchema>;

type LoginFormProps = {
  /** Destino pós-login, já sanitizado pelo Server Component da página. */
  callbackUrl: string;
};

/**
 * Formulário de login (AC1, AC3).
 *
 * A validação do React Hook Form + Zod cuida apenas de campo vazio e formato de
 * e-mail. A resposta a credenciais erradas vem do servidor e é sempre a mesma
 * frase (AC3) — não há tratamento por tipo de erro aqui, e não deve haver.
 */
export function LoginForm({ callbackUrl }: LoginFormProps) {
  const router = useRouter();
  const [isSubmitting, startSubmit] = useTransition();
  const [serverErrorMessage, setServerErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = handleSubmit((values) => {
    setServerErrorMessage(null);

    startSubmit(async () => {
      const result = await loginAction({ ...values, callbackUrl });

      if (!result.ok) {
        setServerErrorMessage(result.message);
        return;
      }

      router.replace(result.redirectTo);
      // Sem o refresh, o layout protegido pode ser servido do cache do roteador
      // com a sessão anterior (ausente) e devolver o usuário para o login.
      router.refresh();
    });
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      {serverErrorMessage && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-900 dark:bg-red-950/40 dark:text-red-200"
        >
          {serverErrorMessage}
        </p>
      )}

      <div className="space-y-2">
        <label
          htmlFor="email"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          E-mail
        </label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          autoFocus
          aria-invalid={errors.email ? true : undefined}
          aria-describedby={errors.email ? 'email-error' : undefined}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300"
          {...register('email')}
        />
        {errors.email && (
          <p id="email-error" className="text-sm text-red-700 dark:text-red-300">
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="space-y-2">
        <label
          htmlFor="password"
          className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Senha
        </label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          aria-invalid={errors.password ? true : undefined}
          aria-describedby={errors.password ? 'password-error' : undefined}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-300"
          {...register('password')}
        />
        {errors.password && (
          <p id="password-error" className="text-sm text-red-700 dark:text-red-300">
            {errors.password.message}
          </p>
        )}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        {isSubmitting ? 'Entrando…' : 'Entrar'}
      </button>
    </form>
  );
}
