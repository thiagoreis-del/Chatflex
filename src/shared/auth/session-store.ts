import { createStore, useStore } from "@/shared/hooks/create-store";
import type { AuthenticatedUser, SessionState } from "./types";

export const sessionStore = createStore<SessionState>({ status: "idle", user: null });

export function setSessionUser(user: AuthenticatedUser) {
  sessionStore.set({ status: "authenticated", user });
}

export function clearSession() {
  sessionStore.set({ status: "unauthenticated", user: null });
}

export function useSession() {
  return useStore(sessionStore);
}
