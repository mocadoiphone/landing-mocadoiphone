import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().pipe(z.email("Informe um e-mail válido.")),
  password: z.string().min(1, "Informe a senha."),
});

export type SignInInput = z.infer<typeof signInSchema>;

/** Formato mínimo dos erros do Supabase Auth usado para escolher a mensagem. */
export type AuthErrorLike = {
  name?: string;
  code?: string | undefined;
  status?: number | undefined;
};

/**
 * Traduz o erro de login para uma mensagem segura ao usuário.
 * Nunca revela se o e-mail existe nem detalhes internos.
 */
export function signInErrorMessage(error: AuthErrorLike): string {
  if (error.code === "over_request_rate_limit" || error.status === 429) {
    return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
  }
  if (error.name === "AuthRetryableFetchError" || error.status === 0) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
  }
  if (error.code === "invalid_credentials" || error.status === 400) {
    return "E-mail ou senha inválidos.";
  }
  return "Não foi possível entrar. Tente novamente.";
}
