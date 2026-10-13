import { createFileRoute } from "@tanstack/react-router";
import { ContactsPage } from "@/modules/contacts/pages/ContactsPage";
import { requireRole } from "@/shared/permissions/route-guards";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/contatos")({
  head: () => pageMeta("contacts:meta.title", "contacts:meta.description", { noindex: true }),
  beforeLoad: () => requireRole(["company_admin", "agent"]),
  component: ContactsPage,
});
