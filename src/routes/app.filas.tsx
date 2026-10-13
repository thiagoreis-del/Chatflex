import { createFileRoute } from "@tanstack/react-router";
import { QueuesPage } from "@/modules/queues/pages/QueuesPage";
import { requireRole } from "@/shared/permissions/route-guards";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/filas")({
  head: () => pageMeta("team:queues.meta.title", "team:queues.meta.description", { noindex: true }),
  beforeLoad: () => requireRole(["company_admin"]),
  component: QueuesPage,
});
