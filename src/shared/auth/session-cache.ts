import type { QueryClient } from "@tanstack/react-query";
import { sessionStore } from "./session-store";

/** Cache is disposable; the authenticated backend remains the source of history. */
export function bindSessionCache(client: QueryClient): () => void {
  let previous = sessionStore.get().user;
  return sessionStore.subscribe(() => {
    const next = sessionStore.get().user;
    if (
      previous?.companyId !== next?.companyId ||
      previous?.id !== next?.id ||
      previous?.role !== next?.role ||
      JSON.stringify(previous?.queueIds) !== JSON.stringify(next?.queueIds) ||
      JSON.stringify(previous?.permissions) !== JSON.stringify(next?.permissions)
    ) {
      // clear() destroys queries and cancels their retries/in-flight reads.
      client.clear();
    }
    previous = next;
  });
}