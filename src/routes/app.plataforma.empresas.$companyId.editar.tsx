import { pageMeta } from "@/shared/config/meta";
import { createFileRoute } from "@tanstack/react-router";
import { CompanyEditPage } from "@/modules/companies/pages/CompanyFormPages";

export const Route = createFileRoute("/app/plataforma/empresas/$companyId/editar")({
  head: () =>
    pageMeta("platform:companies.form.editMeta", "platform:companies.subtitle", { noindex: true }),
  component: RouteComponent,
});

function RouteComponent() {
  const { companyId } = Route.useParams();
  return <CompanyEditPage companyId={companyId} />;
}
