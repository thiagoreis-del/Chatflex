import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { platformKeys } from "@/shared/api/query-keys";
import { platformEndpoints as ep } from "@/shared/config/endpoints";

/** CONTRATO PENDENTE: todos os valores calculados pelo backend. */
export interface PlatformDashboard {
  companies: { active: number; trial: number; overdue: number; suspended: number };
  usersTotal: number;
  connectionsContracted: number;
  monthlyRevenueInCents: number;
  pendingInvoices: number;
  /** Percentual já calculado pelo backend, ex.: 4.2 */
  delinquencyPercent: number;
  usageByPlan: { planId: string; planName: string; companies: number }[];
}

export const dashboardContract = "GET /platform/dashboard";

export const platformDashboardQuery = () =>
  queryOptions({
    queryKey: platformKeys.dashboard(),
    queryFn: ({ signal }) => apiRequest<PlatformDashboard>(ep.dashboard, { signal }),
  });
