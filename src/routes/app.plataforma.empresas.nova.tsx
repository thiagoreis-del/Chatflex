import { createFileRoute } from "@tanstack/react-router";
import { CompanyCreatePage } from "@/modules/companies/pages/CompanyFormPages";

export const Route = createFileRoute("/app/plataforma/empresas/nova")({
  component: CompanyCreatePage,
});
