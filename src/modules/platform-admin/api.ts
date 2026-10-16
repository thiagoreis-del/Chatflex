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
  usageByPlan: { planId: string; planName: string; companies: number; revenueInCents?: number }[];
  totalCompanies?: number;
  connectionsOnline?: number;
  forecastRevenueInCents?: number;
  dueSoon?: CompanyBrief[];
  overdueList?: CompanyBrief[];
  recent?: CompanyBrief[];
}

export interface CompanyBrief {
  id: string;
  name: string;
  planName?: string;
  dueDate?: string | null;
  createdAt?: string | null;
}

export const dashboardContract = "GET /companies/list + /plans/all + /whatsapp/all";

interface RawCompany {
  id: number;
  name?: string;
  status?: boolean | null;
  dueDate?: string | null;
  planId?: number | null;
  createdAt?: string | null;
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
  let forecast = 0;
  const byPlan = new Map<number, { n: number; rev: number }>();
  const dueSoon: CompanyBrief[] = [];
  const overdueList: CompanyBrief[] = [];
  const week = now + 7 * 864e5;
  for (const c of companies) {
    const plan = c.planId != null ? plans.get(c.planId) : undefined;
    const price = Math.round(Number(String(plan?.amount ?? "0").replace(",", ".")) * 100) || 0;
    const due = c.dueDate ? new Date(c.dueDate).getTime() : NaN;
    const brief: CompanyBrief = {
      id: String(c.id),
      name: c.name ?? `#${c.id}`,
      ...(plan?.name ? { planName: plan.name } : {}),
      dueDate: c.dueDate ?? null,
      createdAt: c.createdAt ?? null,
    };
    if (c.status === false) counts.suspended++;
    else if (due < now) {
      counts.overdue++;
      forecast += price;
      overdueList.push(brief);
    } else {
      counts.active++;
      revenue += price;
      forecast += price;
      if (due <= week) dueSoon.push(brief);
    }
    users += plan?.users ?? 0;
    if (c.planId != null) {
      const cur = byPlan.get(c.planId) ?? { n: 0, rev: 0 };
      byPlan.set(c.planId, { n: cur.n + 1, rev: cur.rev + (c.status === false ? 0 : price) });
    }
  }
  const byDate = (k: "dueDate" | "createdAt", dir: 1 | -1) => (a: CompanyBrief, b: CompanyBrief) =>
    dir * (new Date(a[k] ?? 0).getTime() - new Date(b[k] ?? 0).getTime());
  const conns = arr<{ companyId?: number; status?: string }>(connectionsRaw, "whatsapps").filter(
    (w) => w.companyId == null || ids.has(w.companyId),
  );
  const connections = conns.length;
  const online = conns.filter((w) => String(w.status ?? "").toUpperCase() === "CONNECTED").length;
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
      .map(([id, v]) => ({
        planId: String(id),
        planName: plans.get(id)?.name ?? `#${id}`,
        companies: v.n,
        revenueInCents: v.rev,
      }))
      .sort((a, b) => b.companies - a.companies),
    totalCompanies: companies.length,
    connectionsOnline: online,
    forecastRevenueInCents: forecast,
    dueSoon: dueSoon.sort(byDate("dueDate", 1)).slice(0, 6),
    overdueList: overdueList.sort(byDate("dueDate", 1)).slice(0, 6),
    recent: companies
      .map((c) => ({ id: String(c.id), name: c.name ?? `#${c.id}`, createdAt: c.createdAt ?? null }))
      .sort(byDate("createdAt", -1))
      .slice(0, 6),
  };
}

export const platformDashboardQuery = () =>
  queryOptions({
    queryKey: platformKeys.dashboard(),
    refetchInterval: 60_000,
    queryFn: ({ signal }) =>
      env.useMocks
        ? apiRequest<PlatformDashboard>(ep.dashboard, { signal })
        : aggregateDashboard(signal),
  });
