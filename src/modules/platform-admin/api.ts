import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { platformKeys } from "@/shared/api/query-keys";
import { env } from "@/shared/config/env";
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

export const dashboardContract = "GET /companies/list + /plans/all + /whatsapp/all";

interface RawCompany {
  id: number;
  name?: string;
  status?: boolean | null;
  dueDate?: string | null;
  planId?: number | null;
}
interface RawPlan {
  id: number;
  name: string;
  users?: number;
  connections?: number;
  amount?: string | number | null;
}
interface RawInvoice {
  status?: string | null;
}

const arr = <T,>(v: unknown, key: string): T[] =>
  Array.isArray(v) ? (v as T[]) : ((v as Record<string, T[]> | null)?.[key] ?? []);

/** Monta os indicadores a partir de /companies/list, /plans/all, /whatsapp/all e /invoices/all. */
async function aggregateDashboard(signal: AbortSignal): Promise<PlatformDashboard> {
  const [companiesRaw, plansRaw, connectionsRaw, invoicesRaw] = await Promise.all([
    apiRequest<unknown>("/companies/list", { signal }),
    apiRequest<unknown>("/plans/all", { signal }).catch(() => []),
    apiRequest<unknown>("/whatsapp/all?session=0", { signal }).catch(() => []),
    apiRequest<unknown>("/invoices/all", { signal }).catch(() => []),
  ]);
  const companies = arr<RawCompany>(companiesRaw, "companies");
  const ids = new Set(companies.map((c) => c.id));
  const plans = new Map(arr<RawPlan>(plansRaw, "plans").map((p) => [p.id, p]));
  const now = Date.now();
  const counts = { active: 0, trial: 0, overdue: 0, suspended: 0 };
  let users = 0;
  let revenue = 0;
  const byPlan = new Map<number, number>();
  for (const c of companies) {
    const plan = c.planId != null ? plans.get(c.planId) : undefined;
    if (c.status === false) counts.suspended++;
    else if (c.dueDate && new Date(c.dueDate).getTime() < now) counts.overdue++;
    else {
      counts.active++;
      revenue += Math.round(Number(String(plan?.amount ?? "0").replace(",", ".")) * 100) || 0;
    }
    users += plan?.users ?? 0;
    if (c.planId != null) byPlan.set(c.planId, (byPlan.get(c.planId) ?? 0) + 1);
  }
  const connections = arr<{ companyId?: number }>(connectionsRaw, "whatsapps").filter(
    (w) => w.companyId == null || ids.has(w.companyId),
  ).length;
  const pendingInvoices = arr<RawInvoice>(invoicesRaw, "invoices").filter(
    (i) => String(i.status ?? "").toLowerCase() === "open",
  ).length;
  const billable = counts.active + counts.overdue;
  return {
    companies: counts,
    usersTotal: users,
    connectionsContracted: connections,
    monthlyRevenueInCents: revenue,
    pendingInvoices,
    delinquencyPercent: billable ? (counts.overdue / billable) * 100 : 0,
    usageByPlan: [...byPlan.entries()]
      .map(([id, n]) => ({ planId: String(id), planName: plans.get(id)?.name ?? `#${id}`, companies: n }))
      .sort((a, b) => b.companies - a.companies),
  };
}

export const platformDashboardQuery = () =>
  queryOptions({
    queryKey: platformKeys.dashboard(),
    queryFn: ({ signal }) =>
      env.useMocks
        ? apiRequest<PlatformDashboard>(ep.dashboard, { signal })
        : aggregateDashboard(signal),
  });
