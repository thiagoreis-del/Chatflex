import { pageMeta } from "@/shared/config/meta";
import { createFileRoute } from "@tanstack/react-router";
import { PlanCreatePage } from "@/modules/plans/pages/PlanPages";

export const Route = createFileRoute("/app/plataforma/planos/novo")({
  head: () => pageMeta("platform:plans.form.newMeta", "platform:plans.subtitle", { noindex: true }), component: PlanCreatePage });
