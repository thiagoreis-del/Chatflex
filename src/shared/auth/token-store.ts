/**
 * Access token em memória (variável de módulo) com fallback em localStorage.
 * O fallback existe porque o refresh token (cookie HttpOnly) é bloqueado
 * pelos navegadores quando o frontend e a API estão em domínios diferentes
 * (ex.: lovable.app × api.notasflex.com.br). Sem o cookie, a sessão caía
 * a cada recarregamento ou troca de aplicativo no celular.
 * Quando o domínio definitivo estiver no mesmo site da API, este fallback
 * pode ser removido e o token volta a viver só em memória.
 */
const STORAGE_KEY = "chatbotflex.accessToken";

let accessToken: string | null = null;

function readStored(): string | null {
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

export const tokenStore = {
  get: () => {
    if (!accessToken) accessToken = readStored();
    return accessToken;
  },
  set: (token: string) => {
    accessToken = token;
    try {
      window.localStorage.setItem(STORAGE_KEY, token);
    } catch {
      // Sem storage disponível: mantém só em memória.
    }
  },
  clear: () => {
    accessToken = null;
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignora falhas de storage.
    }
  },
};
