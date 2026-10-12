/**
 * Dados FICTÍCIOS da Fase 2 (administração da plataforma).
 * Usados somente quando VITE_USE_MOCKS=true. Valores em centavos.
 */
import type { RequestOptions } from "@/shared/api/client";
import { ApiError } from "@/shared/api/errors";
import type { Company, CompanyStatus, CompanyUsage } from "@/modules/companies/types";
import type { Plan } from "@/modules/plans/types";
import type { Invoice, Subscription } from "@/modules/billing/types";
import type { AuditEvent } from "@/modules/audit/types";
import type { Paginated } from "@/shared/types/pagination";

const allFeatures = {
  campaigns: true,
  internalChat: true,
  integrations: true,
  artificialIntelligence: true,
  advancedReports: true,
  externalApi: true,
  automations: true,
};

const plans: Plan[] = [
  {
    id: "plano-basico",
    name: "Básico",
    description: "Para equipes pequenas começando o atendimento.",
    monthlyPrice: 14900,
    annualPrice: 149000,
    userLimit: 3,
    connectionLimit: 1,
    storageLimitMb: 2048,
    trialDays: 7,
    features: { ...allFeatures, campaigns: false, artificialIntelligence: false, advancedReports: false, externalApi: false, automations: false },
    active: true,
  },
  {
    id: "plano-profissional",
    name: "Profissional",
    description: "Equipes em crescimento com campanhas e relatórios.",
    monthlyPrice: 34900,
    annualPrice: 349000,
    userLimit: 10,
    connectionLimit: 3,
    storageLimitMb: 10240,
    trialDays: 14,
    features: { ...allFeatures, artificialIntelligence: false, externalApi: false },
    active: true,
  },
  {
    id: "plano-empresarial",
    name: "Empresarial",
    description: "Operações grandes com todos os recursos.",
    monthlyPrice: 89900,
    annualPrice: null,
    userLimit: 50,
    connectionLimit: 10,
    storageLimitMb: 51200,
    trialDays: 14,
    features: allFeatures,
    active: true,
  },
];

const names = [
  ["Padaria Pão Dourado Ltda", "Pão Dourado"],
  ["Clínica Sorriso Feliz S/S", "Sorriso Feliz"],
  ["Auto Peças Rota 66 Ltda", "Rota 66"],
  ["Imobiliária Lar Novo Ltda", "Lar Novo"],
  ["Pet Shop Amigo Fiel ME", "Amigo Fiel"],
  ["Escola Saber Mais Ltda", "Saber Mais"],
  ["Academia Corpo Ativo Ltda", "Corpo Ativo"],
  ["Ótica Visão Clara ME", "Visão Clara"],
] as const;
const statuses: CompanyStatus[] = ["active", "active", "trial", "overdue", "active", "suspended", "onboarding", "cancelled"];

const iso = (daysFromNow: number) => new Date(Date.now() + daysFromNow * 86400000).toISOString();

const companies: Company[] = names.map(([legalName, tradeName], i) => {
  const plan = plans[i % plans.length]!;
  return {
    id: `empresa-${i + 1}`,
    legalName,
    tradeName,
    document: `00.000.00${i}/0001-0${i}`,
    email: `contato@empresa${i + 1}.exemplo.test`,
    phone: `(11) 90000-000${i}`,
    responsibleName: `Responsável Fictício ${i + 1}`,
    status: statuses[i]!,
    planId: plan.id,
    planName: plan.name,
    trialEndsAt: statuses[i] === "trial" ? iso(5) : null,
    dueDate: iso(10 - i * 3),
    userLimit: plan.userLimit,
    connectionLimit: plan.connectionLimit,
    storageLimitMb: plan.storageLimitMb,
    usersCount: Math.min(plan.userLimit, 1 + i),
    connectionsCount: Math.min(plan.connectionLimit, 1 + (i % 2)),
    internalNotes: "",
    createdAt: iso(-200 + i * 20),
    updatedAt: iso(-i),
  };
});

const subStatus: Record<CompanyStatus, Subscription["status"]> = {
  active: "active",
  trial: "trialing",
  overdue: "past_due",
  suspended: "suspended",
  cancelled: "cancelled",
  onboarding: "trialing",
};

const subscriptions: Subscription[] = companies.map((c, i) => ({
  id: `assinatura-${i + 1}`,
  companyId: c.id,
  companyName: c.tradeName,
  planId: c.planId,
  planName: c.planName!,
  status: subStatus[c.status],
  billingCycle: i % 3 === 0 ? "annual" : "monthly",
  currentPeriodStart: iso(-20),
  currentPeriodEnd: iso(10),
  cancelledAt: c.status === "cancelled" ? iso(-5) : null,
  nextChargeAt: c.status === "cancelled" ? null : iso(10),
}));

const invoiceStatuses: Invoice["status"][] = ["paid", "open", "overdue", "paid", "cancelled", "refunded"];
const invoices: Invoice[] = subscriptions.flatMap((s, i) =>
  [0, 1].map((k) => ({
    id: `fatura-${i + 1}-${k + 1}`,
    companyId: s.companyId,
    companyName: s.companyName!,
    subscriptionId: s.id,
    amountInCents: plans.find((p) => p.id === s.planId)!.monthlyPrice,
    currency: "BRL" as const,
    status: invoiceStatuses[(i + k) % invoiceStatuses.length]!,
    dueDate: iso(-30 * k + 5 - i),
    paidAt: invoiceStatuses[(i + k) % invoiceStatuses.length] === "paid" ? iso(-30 * k) : null,
    createdAt: iso(-30 * k - 10),
  })),
);

const auditEvents: AuditEvent[] = [];
function audit(action: string, resource: string, resourceId: string | null, companyId: string | null, reason: string | null = null) {
  const c = companies.find((x) => x.id === companyId);
  auditEvents.unshift({
    id: `auditoria-${auditEvents.length + 1}`,
    occurredAt: new Date().toISOString(),
    actorId: "demo-superadmin",
    actorName: "Superadmin Demonstração",
    companyId,
    companyName: c?.tradeName ?? null,
    action,
    resource,
    resourceId,
    result: "success",
    reason,
    origin: "painel",
  });
}
companies.slice(0, 5).forEach((c) => audit("company.create", "company", c.id, c.id));
audit("plan.update", "plan", "plano-profissional", null);

function paginate<T>(items: T[], q: URLSearchParams): Paginated<T> {
  const page = Number(q.get("page") ?? 1);
  const pageSize = Number(q.get("pageSize") ?? 10);
  return { data: items.slice((page - 1) * pageSize, page * pageSize), page, pageSize, total: items.length };
}

const match = (q: URLSearchParams, key: string, value: string | null | undefined) =>
  !q.get(key) || q.get(key) === value;

const statusActions: Record<string, CompanyStatus> = {
  activate: "active",
  suspend: "suspended",
  reactivate: "active",
  cancel: "cancelled",
  "end-trial": "active",
};

/** Retorna `undefined` quando o caminho não pertence à plataforma. */
export function platformMock(fullPath: string, opts: RequestOptions): unknown {
  const [path = "", qs = ""] = fullPath.split("?");
  if (!path.startsWith("/platform/")) return undefined;
  const q = new URLSearchParams(qs);
  const method = opts.method ?? "GET";
  const body = (opts.body ?? {}) as Record<string, unknown>;
  const parts = path.split("/").slice(2).map(decodeURIComponent);
  const [resource, id, sub] = parts;

  switch (resource) {
    case "dashboard":
      return {
        companies: {
          active: companies.filter((c) => c.status === "active").length,
          trial: companies.filter((c) => c.status === "trial").length,
          overdue: companies.filter((c) => c.status === "overdue").length,
          suspended: companies.filter((c) => c.status === "suspended").length,
        },
        usersTotal: companies.reduce((s, c) => s + (c.usersCount ?? 0), 0),
        connectionsContracted: companies.reduce((s, c) => s + c.connectionLimit, 0),
        monthlyRevenueInCents: invoices.filter((i) => i.status === "paid").reduce((s, i) => s + i.amountInCents, 0),
        pendingInvoices: invoices.filter((i) => i.status === "open" || i.status === "overdue").length,
        delinquencyPercent: Math.round((companies.filter((c) => c.status === "overdue").length / companies.length) * 1000) / 10,
        usageByPlan: plans.map((p) => ({ planId: p.id, planName: p.name, companies: companies.filter((c) => c.planId === p.id).length })),
      };

    case "companies": {
      if (!id) {
        if (method === "POST") {
          const plan = plans.find((p) => p.id === body["planId"]) ?? plans[0]!;
          const c: Company = {
            ...(body as unknown as Company),
            id: `empresa-${companies.length + 1}`,
            planName: plan.name,
            usersCount: 1,
            connectionsCount: 0,
            trialEndsAt: body["status"] === "trial" ? iso(Number(body["trialDays"] ?? 0)) : null,
            dueDate: iso(30),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          delete (c as unknown as Record<string, unknown>)["firstAdmin"];
          companies.unshift(c);
          audit("company.create", "company", c.id, c.id);
          return c;
        }
        const s = (q.get("search") ?? "").toLowerCase();
        return paginate(
          companies.filter(
            (c) =>
              (!s || `${c.legalName} ${c.tradeName} ${c.document} ${c.email}`.toLowerCase().includes(s)) &&
              match(q, "status", c.status) &&
              match(q, "planId", c.planId),
          ),
          q,
        );
      }
      const c = companies.find((x) => x.id === id);
      if (!c) throw new ApiError("notFound", 404);
      if (sub === "usage") {
        const usage: CompanyUsage = {
          users: { used: c.usersCount ?? 0, limit: c.userLimit },
          connections: { used: c.connectionsCount ?? 0, limit: c.connectionLimit },
          storage: { usedMb: Math.round(c.storageLimitMb * 0.42), limitMb: c.storageLimitMb },
          updatedAt: new Date().toISOString(),
        };
        return usage;
      }
      if (sub && statusActions[sub]) {
        c.status = statusActions[sub]!;
        if (sub === "end-trial") c.trialEndsAt = null;
        c.updatedAt = new Date().toISOString();
        audit(`company.${sub}`, "company", c.id, c.id, String(body["reason"] ?? "") || null);
        return c;
      }
      if (sub === "limits" || (!sub && method === "PATCH")) {
        const { reason, ...rest } = body;
        Object.assign(c, rest, { updatedAt: new Date().toISOString() });
        if (rest["planId"]) c.planName = plans.find((p) => p.id === rest["planId"])?.name ?? c.planName;
        audit(sub === "limits" ? "company.limits" : "company.update", "company", c.id, c.id, (reason as string) || null);
        return c;
      }
      return c;
    }

    case "plans": {
      if (!id) {
        if (method === "POST") {
          const p = { ...(body as unknown as Plan), id: `plano-${plans.length + 1}` };
          plans.push(p);
          audit("plan.create", "plan", p.id, null);
          return p;
        }
        return plans;
      }
      const p = plans.find((x) => x.id === id);
      if (!p) throw new ApiError("notFound", 404);
      if (method === "PATCH") {
        Object.assign(p, body);
        audit("plan.update", "plan", p.id, null);
      }
      return p;
    }

    case "subscriptions":
      return paginate(subscriptions.filter((s) => match(q, "companyId", s.companyId) && match(q, "status", s.status)), q);

    case "invoices":
      return paginate(
        invoices.filter(
          (i) =>
            match(q, "companyId", i.companyId) &&
            match(q, "status", i.status) &&
            (!q.get("dueFrom") || i.dueDate >= q.get("dueFrom")!) &&
            (!q.get("dueTo") || i.dueDate.slice(0, 10) <= q.get("dueTo")!),
        ),
        q,
      );

    case "audit-events":
      return paginate(
        auditEvents.filter(
          (e) =>
            match(q, "companyId", e.companyId) &&
            match(q, "result", e.result) &&
            match(q, "resource", e.resource) &&
            (!q.get("action") || e.action.includes(q.get("action")!)),
        ),
        q,
      );
  }
  throw new ApiError("notFound", 404);
}
