import { pageMeta } from "@/shared/config/meta";
import { createFileRoute } from "@tanstack/react-router";
import { PlansListPage } from "@/modules/plans/pages/PlanPages";

export const Route = createFileRoute("/app/plataforma/planos/")({
  head: () => pageMeta("platform:plans.meta", "platform:plans.subtitle", { noindex: true }), component: PlansListPage });
