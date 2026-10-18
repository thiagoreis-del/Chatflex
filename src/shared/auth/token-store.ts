/**
 * Access token exclusivamente em memória. Renovação via cookie HttpOnly.
 */
const STORAGE_KEY = "chatbotflex.accessToken";

let accessToken: string | null = null;
/** Incrementa a cada troca de token; detecta pedidos feitos com token antigo. */
let generation = 0;

try { window.localStorage.removeItem(STORAGE_KEY); } catch { /* SSR / storage bloqueado */ }

export const tokenStore = {
  get: () => accessToken,
  set: (token: string) => {
    accessToken = token;
    generation += 1;
  },
  clear: () => {
    accessToken = null;
    generation += 1;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignora falhas de storage.
    }
  },
  /** Geração atual do token; pedidos iniciados com valor diferente usaram token antigo. */
  generation: () => generation,
};
