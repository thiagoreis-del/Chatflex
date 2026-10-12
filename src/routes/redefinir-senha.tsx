import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { ResetPasswordPage } from "@/modules/auth/pages/ResetPasswordPage";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/redefinir-senha")({
  validateSearch: z.object({ token: z.string().optional() }),
  head: () => pageMeta("auth:reset.title", "auth:reset.subtitle", { noindex: true }),
  component: ResetRoute,
});

function ResetRoute() {
  const { token } = Route.useSearch();
  return <ResetPasswordPage token={token} />;
}
