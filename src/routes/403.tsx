import { createFileRoute } from "@tanstack/react-router";
import { StatusPage } from "@/app/pages/StatusPage";
import { AccessDenied } from "@/shared/components";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/403")({
  head: () => pageMeta("errors:403.meta", "errors:403.description", { noindex: true }),
  component: () => (
    <StatusPage>
      <AccessDenied />
    </StatusPage>
  ),
});
