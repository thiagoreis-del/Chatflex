import { pageMeta } from "@/shared/config/meta";
import { createFileRoute } from "@tanstack/react-router";
import { InvoicesPage } from "@/modules/billing/pages/InvoicesPage";
import type { InvoiceFilters } from "@/modules/billing/types";
import { parseListSearch } from "@/shared/router/search";

export const Route = createFileRoute("/app/plataforma/faturas")({
  head: () => pageMeta("platform:invoices.meta", "platform:invoices.subtitle", { noindex: true }),
  validateSearch: (raw: Record<string, unknown>) =>
    parseListSearch<InvoiceFilters>(raw, [
      "companyId",
      "status",
      "dueFrom",
      "dueTo",
      "createdFrom",
      "createdTo",
    ]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <InvoicesPage
      search={search}
      setSearch={(s) => void navigate({ to: ".", search: (prev) => ({ ...prev, ...s }) })}
    />
  );
}
