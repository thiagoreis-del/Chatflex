/**
 * Única leitura de variáveis de ambiente do frontend.
 * Todas são PÚBLICAS (prefixo VITE_). Nunca adicione segredos aqui.
 * Os valores padrão espelham o `.env.example` para que o preview funcione sem `.env`.
 */
const raw = import.meta.env;

function trimSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export const env = {
  apiUrl: trimSlash(raw.VITE_API_URL ?? "https://api.notasflex.com.br"),
  socketUrl: trimSlash(raw.VITE_SOCKET_URL ?? "https://api.notasflex.com.br"),
  appName: raw.VITE_APP_NAME ?? "ChatFlex",
  appUrl: trimSlash(raw.VITE_APP_URL ?? "https://chat.notasflex.com.br"),
  /** Mocks somente quando explicitamente "true". Nunca há fallback automático. */
  useMocks: raw.VITE_USE_MOCKS === "true",
} as const;
