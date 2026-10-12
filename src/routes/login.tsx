import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { LoginPage } from "@/modules/auth/pages/LoginPage";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/login")({
  validateSearch: z.object({ redirect: z.string().optional() }),
  head: () => pageMeta("auth:login.submit", "auth:login.subtitle"),
  component: LoginRoute,
});

function LoginRoute() {
  const { redirect } = Route.useSearch();
  return <LoginPage redirectTo={redirect} />;
}
