/**
 * Access token SOMENTE em memória (variável de módulo).
 * Proibido: localStorage, sessionStorage, IndexedDB ou cookies legíveis por JS.
 * O refresh token vive em cookie HttpOnly criado pelo backend.
 */
let accessToken: string | null = null;

export const tokenStore = {
  get: () => accessToken,
  set: (token: string) => {
    accessToken = token;
  },
  clear: () => {
    accessToken = null;
  },
};
