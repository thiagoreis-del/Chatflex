import { createStore, useStore } from "@/shared/hooks/create-store";

/** Estado observado da API, derivado das últimas respostas (sem endpoint extra). */
export type ApiStatus = "unknown" | "online" | "offline";

export const apiStatusStore = createStore<ApiStatus>("unknown");

export function useApiStatus() {
  return useStore(apiStatusStore);
}
