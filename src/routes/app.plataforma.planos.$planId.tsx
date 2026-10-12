import { createFileRoute } from "@tanstack/react-router";
import { PlanDetailPage } from "@/modules/plans/pages/PlanPages";

export const Route = createFileRoute("/app/plataforma/planos/$planId")({ component: RouteComponent });

function RouteComponent() {
  const { planId } = Route.useParams();
  return <PlanDetailPage planId={planId} />;
}
