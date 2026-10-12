import { createFileRoute } from "@tanstack/react-router";
import { CompanyEditPage } from "@/modules/companies/pages/CompanyFormPages";

export const Route = createFileRoute("/app/plataforma/empresas/$companyId/editar")({ component: RouteComponent });

function RouteComponent() {
  const { companyId } = Route.useParams();
  return <CompanyEditPage companyId={companyId} />;
}
