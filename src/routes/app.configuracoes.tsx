import { createFileRoute } from "@tanstack/react-router";
import { SettingsPage } from "@/modules/settings/pages/SettingsPage";
import { requireRole } from "@/shared/permissions/route-guards";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/configuracoes")({
  head: () => pageMeta("settings:meta", "settings:subtitle", { noindex: true }),
  beforeLoad: () => requireRole(["company_admin"]),
  component: SettingsPage,
});
