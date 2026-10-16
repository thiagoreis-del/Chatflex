import { MutationCache, QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { notifyError, shouldRetry } from "@/shared/errors/handle-error";

// Após uma publicação, abas abertas podem pedir arquivos antigos que não existem mais.
// Recarrega uma vez (no máx. a cada 10s) para buscar a versão nova em vez de exibir tela branca.
if (typeof window !== "undefined") {
  const reloadOnce = () => {
    const key = "chunk-reload-at";
    const last = Number(sessionStorage.getItem(key) ?? 0);
    if (Date.now() - last < 10_000) return;
    sessionStorage.setItem(key, String(Date.now()));
    window.location.reload();
  };
  window.addEventListener("vite:preloadError", (e) => {
    e.preventDefault();
    reloadOnce();
  });
  window.addEventListener("unhandledrejection", (e) => {
    const msg = String((e.reason as Error | undefined)?.message ?? e.reason ?? "");
    if (/Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(msg)) reloadOnce();
  });
}

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
