import { createFileRoute } from "@tanstack/react-router";
import { CompaniesListPage } from "@/modules/companies/pages/CompaniesListPage";
import type { CompanyFilters } from "@/modules/companies/types";
import { parseListSearch } from "@/shared/router/search";

export const Route = createFileRoute("/app/plataforma/empresas/")({
  validateSearch: (raw: Record<string, unknown>) =>
    parseListSearch<CompanyFilters>(raw, ["search", "status", "planId"]),
  component: RouteComponent,
});

function RouteComponent() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  return (
    <CompaniesListPage
      search={search}
      setSearch={(s) => void navigate({ to: ".", search: (prev) => ({ ...prev, ...s }) })}
    />
  );
}
