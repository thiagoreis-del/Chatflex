import { createFileRoute, redirect } from "@tanstack/react-router";
import { ConnectionsPage } from "@/modules/whatsapp/pages/ConnectionsPage";
import { sessionStore } from "@/shared/auth/session-store";
import { can } from "@/shared/permissions/catalog";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/conexoes")({
  head: () =>
    pageMeta("whatsapp:meta.title", "whatsapp:meta.description", { noindex: true }),
  beforeLoad: () => {
    if (!can(sessionStore.get().user, "module.connections")) throw redirect({ to: "/403" });
  },
  component: ConnectionsPage,
});
