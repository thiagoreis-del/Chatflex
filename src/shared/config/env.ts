/**
 * Única leitura de variáveis de ambiente do frontend.
 * Todas são PÚBLICAS (prefixo VITE_). Nunca adicione segredos aqui.
 * Os valores padrão espelham o `.env.example` para que o preview funcione sem `.env`.
 */

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const env = {
  apiUrl: trimSlash(import.meta.env.VITE_API_URL ?? "https://api.notasflex.com.br"),
  socketUrl: trimSlash(import.meta.env.VITE_SOCKET_URL ?? "https://api.notasflex.com.br"),
  appName: import.meta.env.VITE_APP_NAME ?? "ChatbotFlex",
  appUrl: trimSlash(import.meta.env.VITE_APP_URL ?? "https://chatbotflex.com.br"),
  /** Mocks somente quando explicitamente "true". Nunca há fallback automático. */
  useMocks: import.meta.env.VITE_USE_MOCKS === "true",
} as const;
