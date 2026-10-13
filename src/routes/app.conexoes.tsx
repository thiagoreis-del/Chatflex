import { createFileRoute } from "@tanstack/react-router";
import { ConnectionsPage } from "@/modules/whatsapp/pages/ConnectionsPage";
import { requireRole } from "@/shared/permissions/route-guards";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/conexoes")({
  head: () => pageMeta("whatsapp:meta.title", "whatsapp:meta.description", { noindex: true }),
  beforeLoad: () => requireRole(["company_admin", "superadmin"]),
  component: ConnectionsPage,
});
