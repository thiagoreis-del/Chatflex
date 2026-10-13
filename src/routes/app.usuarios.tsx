import { createFileRoute } from "@tanstack/react-router";
import { UsersPage } from "@/modules/users/pages/UsersPage";
import { requireRole } from "@/shared/permissions/route-guards";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/usuarios")({
  head: () => pageMeta("team:users.meta.title", "team:users.meta.description", { noindex: true }),
  beforeLoad: () => requireRole(["company_admin"]),
  component: UsersPage,
});
