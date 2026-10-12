import { createFileRoute } from "@tanstack/react-router";
import { InvoicesPage } from "@/modules/billing/pages/InvoicesPage";
import type { InvoiceFilters } from "@/modules/billing/types";
import { parseListSearch } from "@/shared/router/search";

export const Route = createFileRoute("/app/plataforma/faturas")({
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
