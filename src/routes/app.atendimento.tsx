import { createFileRoute } from "@tanstack/react-router";
import { TicketsPage } from "@/modules/tickets/pages/TicketsPage";
import { requireRole } from "@/shared/permissions/route-guards";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/atendimento")({
  head: () => pageMeta("tickets:meta.title", "tickets:meta.description", { noindex: true }),
  beforeLoad: () => requireRole(["company_admin", "agent"]),
  component: TicketsPage,
});
