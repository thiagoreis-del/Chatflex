import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { planKeys } from "@/shared/api/query-keys";
import { platformEndpoints as ep } from "@/shared/config/endpoints";
import type { Plan, PlanInput } from "./types";

export const planContracts = { list: "GET /platform/plans", detail: "GET /platform/plans/:planId" };

export const plansQuery = () =>
  queryOptions({
    queryKey: planKeys.list(),
    queryFn: ({ signal }) => apiRequest<Plan[]>(ep.plans, { signal }),
    staleTime: 60_000,
  });

export const planQuery = (planId: string) =>
  queryOptions({
    queryKey: planKeys.detail(planId),
    queryFn: ({ signal }) => apiRequest<Plan>(ep.plan(planId), { signal }),
  });

export function createPlan(body: PlanInput) {
  return apiRequest<Plan>(ep.plans, { method: "POST", body });
}

export function updatePlan(planId: string, body: Partial<PlanInput>) {
  return apiRequest<Plan>(ep.plan(planId), { method: "PATCH", body });
}
