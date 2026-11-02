import { publicEnv } from "@/config/env";

/**
 * Configuração estática do site. Dados comerciais (preço, telefone, produto)
 * nunca entram aqui: vêm do banco a partir da Etapa 02 (MDI-D002).
 */
export const siteConfig = {
  name: "Moça do iPhone",
  locale: "pt-BR",
  /** Domínio normativo do Brain; em deploy, a variável explícita prevalece. */
  url: publicEnv.NEXT_PUBLIC_SITE_URL ?? "https://mocadoiphone.com",
  /** Nunca libera indexação por inferência de ambiente ou domínio. */
  indexingEnabled: publicEnv.NEXT_PUBLIC_SITE_INDEXING_ENABLED === "true",
} as const;
