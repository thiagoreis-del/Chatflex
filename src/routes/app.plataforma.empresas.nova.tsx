import { pageMeta } from "@/shared/config/meta";
import { createFileRoute } from "@tanstack/react-router";
import { CompanyCreatePage } from "@/modules/companies/pages/CompanyFormPages";

export const Route = createFileRoute("/app/plataforma/empresas/nova")({
  head: () => pageMeta("platform:companies.form.newMeta", "platform:companies.form.newSubtitle", { noindex: true }),
  component: CompanyCreatePage,
});
