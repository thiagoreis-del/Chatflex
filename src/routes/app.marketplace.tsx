import { createFileRoute } from "@tanstack/react-router";
import { MarketplacePage } from "@/modules/marketplace/pages/MarketplacePage";
import { pageMeta } from "@/shared/config/meta";
import { requireRole } from "@/shared/permissions/route-guards";

export const Route = createFileRoute("/app/marketplace")({
  head: () => pageMeta("marketplace:meta.title", "marketplace:meta.description", { noindex: true }),
  beforeLoad: () => requireRole(["company_admin", "agent"]),
  component: MarketplacePage,
});
