import { createFileRoute } from "@tanstack/react-router";
import { QuickMessagesPage } from "@/modules/quick-messages/pages/QuickMessagesPage";
import { requireRole } from "@/shared/permissions/route-guards";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/respostas-rapidas")({
  head: () =>
    pageMeta("quickMessages:meta.title", "quickMessages:meta.description", { noindex: true }),
  beforeLoad: () => requireRole(["company_admin", "agent"]),
  component: QuickMessagesPage,
});
