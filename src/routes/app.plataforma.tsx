import { createFileRoute, Outlet } from "@tanstack/react-router";
import { requireRole } from "@/shared/permissions/route-guards";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/plataforma")({
  head: () => pageMeta("dashboard:meta", undefined, { noindex: true }),
  beforeLoad: () => requireRole(["superadmin"]),
  component: () => <Outlet />,
});
