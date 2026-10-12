import { createFileRoute } from "@tanstack/react-router";
import { CompanyDetailPage } from "@/modules/companies/pages/CompanyDetailPage";

export const Route = createFileRoute("/app/plataforma/empresas/$companyId/")({
  component: RouteComponent,
});

function RouteComponent() {
  const { companyId } = Route.useParams();
  return <CompanyDetailPage companyId={companyId} />;
}
