import { createFileRoute } from "@tanstack/react-router";
import { PlanCreatePage } from "@/modules/plans/pages/PlanPages";

export const Route = createFileRoute("/app/plataforma/planos/novo")({ component: PlanCreatePage });
