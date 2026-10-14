import { pageMeta } from "@/shared/config/meta";
import { createFileRoute } from "@tanstack/react-router";
import { AuditPage } from "@/modules/audit/pages/AuditPage";
import type { AuditFilters } from "@/modules/audit/types";
import { parseListSearch } from "@/shared/router/search";

export const Route = createFileRoute("/app/plataforma/auditoria")({
  head: () => pageMeta("platform:audit.meta", "platform:audit.subtitle", { noindex: true }),
  validateSearch: (raw: Record<string, unknown>) =>
    parseListSearch<AuditFilters>(raw, [
      "from",
      "to",
      "companyId",
      "userId",
      "action",
      "result",
      "resource",
      "resourceId",
    ]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <AuditPage
      search={search}
      setSearch={(s) => void navigate({ to: ".", search: (prev) => ({ ...prev, ...s }) })}
    />
  );
}
