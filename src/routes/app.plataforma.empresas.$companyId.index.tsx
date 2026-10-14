import { pageMeta } from "@/shared/config/meta";
import { createFileRoute } from "@tanstack/react-router";
import { CompanyDetailPage } from "@/modules/companies/pages/CompanyDetailPage";

export const Route = createFileRoute("/app/plataforma/empresas/$companyId/")({
  head: () => pageMeta("platform:companies.detail.meta", "platform:companies.subtitle", { noindex: true }),
  component: RouteComponent,
});

function RouteComponent() {
  const { companyId } = Route.useParams();
  return <CompanyDetailPage companyId={companyId} />;
}
