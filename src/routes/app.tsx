import { createFileRoute, isRedirect, Outlet, redirect } from "@tanstack/react-router";
import { AppShell } from "@/app/layout/AppShell";
import { LoadingState } from "@/shared/components";
import { ensureSession } from "@/shared/auth/auth-service";
import { pageMeta } from "@/shared/config/meta";

/**
 * Área autenticada. Roda só no navegador: o token vive em memória do cliente.
 * Após recarregar, tenta renovar a sessão pelo cookie HttpOnly.
 */
export const Route = createFileRoute("/app")({
  ssr: false,
  head: () => pageMeta("dashboard:meta", undefined, { noindex: true }),
  beforeLoad: async ({ location }) => {
    try {
      const ok = await ensureSession();
      if (!ok) throw redirect({ to: "/login", search: { redirect: location.href } });
    } catch (error) {
      if (isRedirect(error)) throw error;
      throw redirect({ to: "/indisponivel" });
    }
  },
  pendingComponent: () => <LoadingState className="min-h-screen" />,
  component: AppLayout,
});

function AppLayout() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}
