import { createFileRoute } from "@tanstack/react-router";
import { PlansListPage } from "@/modules/plans/pages/PlanPages";

export const Route = createFileRoute("/app/plataforma/planos/")({ component: PlansListPage });
