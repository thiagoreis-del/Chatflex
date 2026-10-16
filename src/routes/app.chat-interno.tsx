import { createFileRoute } from "@tanstack/react-router";
import { InternalChatPage } from "@/modules/internal-chat/pages/InternalChatPage";
import { requireRole } from "@/shared/permissions/route-guards";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/app/chat-interno")({
  head: () => pageMeta("internalChat:meta.title", "internalChat:meta.description", { noindex: true }),
  beforeLoad: () => requireRole(["company_admin", "agent"]),
  component: InternalChatPage,
});
