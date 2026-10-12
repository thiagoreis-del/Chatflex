import { createFileRoute } from "@tanstack/react-router";
import { DashboardPage } from "@/app/dashboard/DashboardPage";
import { requireRole } from "@/shared/permissions/route-guards";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/dashboard")({
  head: () => pageMeta("dashboard:meta", undefined, { noindex: true }),
  beforeLoad: () => requireRole(["superadmin", "company_admin", "agent"]),
  component: DashboardPage,
});
