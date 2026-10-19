import { pageMeta } from "@/shared/config/meta";
import { createFileRoute } from "@tanstack/react-router";
import { PlatformDashboardPage } from "@/modules/platform-admin/pages/PlatformDashboardPage";

export const Route = createFileRoute("/app/plataforma/")({
  head: () => pageMeta("platform:dashboard.meta", "platform:dashboard.subtitle", { noindex: true }),
  component: PlatformDashboardPage,
});
