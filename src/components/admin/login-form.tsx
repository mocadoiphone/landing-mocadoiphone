"use client";

import { useRouter } from "next/navigation";
import { type FormEvent, useState, useTransition } from "react";

import { signInErrorMessage, signInSchema } from "@/lib/auth/sign-in";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

const fieldClass =
  "rounded-control border border-border bg-surface-elevated px-3 py-2 text-body";

export function LoginForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const parsed = signInSchema.safeParse({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!parsed.success) {
      setError(
        parsed.error.issues[0]?.message ?? "Verifique os dados informados.",
      );
      return;
    }

    setError(null);
    startTransition(async () => {
      // Login direto do navegador: o limite de tentativas do Supabase vale por IP do usuário.
      const supabase = createSupabaseBrowserClient();
      const { error: signInError } = await supabase.auth.signInWithPassword(
        parsed.data,
      );

      if (signInError) {
        setError(signInErrorMessage(signInError));
        return;
      }

      router.replace("/admin");
      router.refresh();
    });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-caption font-medium">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          className={fieldClass}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-caption font-medium">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className={fieldClass}
        />
      </div>

      <p role="alert" className="min-h-6 text-caption text-danger">
        {error}
      </p>

      <button
        type="submit"
        disabled={isPending}
        className="rounded-control bg-accent px-4 py-2.5 font-medium text-accent-foreground disabled:opacity-60"
      >
        {isPending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
