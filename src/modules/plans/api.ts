import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { planKeys } from "@/shared/api/query-keys";
import { env } from "@/shared/config/env";
import { platformEndpoints as ep } from "@/shared/config/endpoints";
import type { Plan, PlanInput } from "./types";

/**
 * CONFIRMADO no código ZapPro/Whaticket: GET /plans/all, GET /plans/:id, POST /plans, PUT /plans/:id.
 * Com mocks ativos, mantém os caminhos de demonstração /platform/plans.
 */
export const planContracts = { list: "GET /plans/all", detail: "GET /plans/:id" };

interface BackendPlan {
  id: number;
  name: string;
  users?: number;
  connections?: number;
  queues?: number;
  amount?: string | number | null;
  useCampaigns?: boolean;
  useSchedules?: boolean;
  useInternalChat?: boolean;
  useExternalApi?: boolean;
  useKanban?: boolean;
  useOpenAi?: boolean;
  useIntegrations?: boolean;
  trial?: boolean;
  trialDays?: number;
  isPublic?: boolean;
}

export function fromBackendPlan(p: BackendPlan): Plan {
  const amount = Number(String(p.amount ?? "0").replace(",", "."));
  return {
    id: String(p.id),
    name: p.name,
    description: "",
    monthlyPrice: Number.isFinite(amount) ? Math.round(amount * 100) : 0,
    annualPrice: null,
    userLimit: p.users ?? 0,
    connectionLimit: p.connections ?? 0,
    storageLimitMb: 0,
    trialDays: p.trial ? (p.trialDays ?? 0) : 0,
    features: {
      campaigns: !!p.useCampaigns,
      internalChat: !!p.useInternalChat,
      integrations: !!p.useIntegrations,
      artificialIntelligence: !!p.useOpenAi,
      advancedReports: !!p.useKanban,
      externalApi: !!p.useExternalApi,
      automations: !!p.useSchedules,
    },
    active: p.isPublic ?? true,
  };
}

function toBackendPlan(p: Partial<PlanInput>) {
  const f = p.features;
  return {
    ...(p.name !== undefined && { name: p.name }),
    ...(p.userLimit !== undefined && { users: p.userLimit }),
    ...(p.connectionLimit !== undefined && { connections: p.connectionLimit }),
    ...(p.monthlyPrice !== undefined && { amount: (p.monthlyPrice / 100).toFixed(2) }),
    ...(p.trialDays !== undefined && { trial: p.trialDays > 0, trialDays: p.trialDays }),
    ...(p.active !== undefined && { isPublic: p.active }),
    ...(f && {
      useWhatsapp: true,
      useCampaigns: f.campaigns,
      useInternalChat: f.internalChat,
      useIntegrations: f.integrations,
      useOpenAi: f.artificialIntelligence,
      useKanban: f.advancedReports,
      useExternalApi: f.externalApi,
      useSchedules: f.automations,
    }),
    recurrence: "MENSAL",
  };
}

export const plansQuery = () =>
  queryOptions({
    queryKey: planKeys.list(),
    queryFn: async ({ signal }) => {
      if (env.useMocks) return apiRequest<Plan[]>(ep.plans, { signal });
      const raw = await apiRequest<BackendPlan[]>("/plans/all", { signal });
      return raw.map(fromBackendPlan);
    },
    staleTime: 60_000,
  });

export const planQuery = (planId: string) =>
  queryOptions({
    queryKey: planKeys.detail(planId),
    queryFn: async ({ signal }) => {
      if (env.useMocks) return apiRequest<Plan>(ep.plan(planId), { signal });
      return fromBackendPlan(await apiRequest<BackendPlan>(`/plans/${encodeURIComponent(planId)}`, { signal }));
    },
  });

export async function createPlan(body: PlanInput) {
  if (env.useMocks) return apiRequest<Plan>(ep.plans, { method: "POST", body });
  const raw = await apiRequest<BackendPlan>("/plans", {
    method: "POST",
    body: { queues: 10, ...toBackendPlan(body) },
  });
  return fromBackendPlan(raw);
}

export async function updatePlan(planId: string, body: Partial<PlanInput>) {
  if (env.useMocks) return apiRequest<Plan>(ep.plan(planId), { method: "PATCH", body });
  const raw = await apiRequest<BackendPlan>(`/plans/${encodeURIComponent(planId)}`, {
    method: "PUT",
    body: { id: Number(planId), ...toBackendPlan(body) },
  });
  return fromBackendPlan(raw);
}
