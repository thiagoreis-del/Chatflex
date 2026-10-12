import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { notifyError, shouldRetry } from "@/shared/errors/handle-error";

export const getRouter = () => {
  // Consultas exibem o erro na própria página (QueryBoundary); mutações notificam por aviso.
  const queryClient = new QueryClient({
    mutationCache: new MutationCache({ onError: notifyError }),
    defaultOptions: { queries: { retry: shouldRetry, refetchOnWindowFocus: false } },
  });

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
  });

  return router;
};
