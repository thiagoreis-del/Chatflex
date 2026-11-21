import { useMemo, useSyncExternalStore } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useSession } from "@/shared/auth/session-store";
import { cachedAdvertisements } from "./advertisement-origin";

/** Session-bound, cache-only observation; no storage or extra API traffic. */
export function useAdvertisementOrigins() {
  const client = useQueryClient();
  const { user } = useSession();
  const companyId = user?.companyId ?? "";
  const userId = user?.id ?? "";
  const store = useMemo(() => {
    const cache = client.getQueryCache();
    const read = () =>
      cachedAdvertisements(
        cache.getAll().map((query) => ({ queryKey: query.queryKey, data: query.state.data })),
        [companyId, userId],
      );
    let snapshot = read();
    return {
      getSnapshot: () => snapshot,
      subscribe: (notify: () => void) =>
        cache.subscribe((event) => {
          const key = event.query.queryKey;
          if (
            key[0] !== "company" ||
            key[1] !== "tickets" ||
            key[2] !== companyId ||
            key[3] !== userId
          )
            return;
          if (
            event.type !== "removed" &&
            !(event.type === "updated" && event.action.type === "success")
          )
            return;
          snapshot = read();
          notify();
        }),
    };
  }, [client, companyId, userId]);
  return useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
}
