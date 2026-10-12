import { createFileRoute } from "@tanstack/react-router";
import { ForgotPasswordPage } from "@/modules/auth/pages/ForgotPasswordPage";
import { pageMeta } from "@/shared/config/meta";

export const Route = createFileRoute("/esqueci-minha-senha")({
  head: () => pageMeta("auth:forgot.title", "auth:forgot.subtitle"),
  component: ForgotPasswordPage,
});
