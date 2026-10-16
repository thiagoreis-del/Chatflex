import { createFileRoute, redirect } from "@tanstack/react-router";
import { StatusPublishPage } from "@/modules/whatsapp/pages/StatusPublishPage";
import { sessionStore } from "@/shared/auth/session-store";
import { can } from "@/shared/permissions/catalog";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/status")({
  head: () => pageMeta("whatsapp:status.meta.title", "whatsapp:status.meta.description", { noindex: true }),
  beforeLoad: () => {
    if (!can(sessionStore.get().user, "module.status")) throw redirect({ to: "/403" });
  },
  component: StatusPublishPage,
});
