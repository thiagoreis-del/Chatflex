import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { auditKeys } from "@/shared/api/query-keys";
import { platformEndpoints as ep } from "@/shared/config/endpoints";

export const impersonationContract = "GET /platform/impersonation-logs";

export interface ImpersonationLog {
  id: string;
  userName: string;
  companyId: string;
  companyName: string | null;
  action: "enter" | "exit";
  ip: string | null;
  createdAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = { [k: string]: any } & Partial<
  Record<
    | "id"
    | "logs"
    | "data"
    | "superUser"
    | "user"
    | "company"
    | "superUserName"
    | "name"
    | "superUserId"
    | "companyId"
    | "companyName"
    | "action"
    | "ip"
    | "createdAt",
    unknown
  >
>;
const str = (v: unknown) => (v === null || v === undefined ? "" : String(v));

export function normalizeImpersonationLogs(res: unknown): ImpersonationLog[] {
  const r = res as Raw | unknown[];
  const list = (Array.isArray(r) ? r : ((r as Raw)?.logs ?? (r as Raw)?.data ?? [])) as Raw[];
  if (!Array.isArray(list)) return [];
  return list.map((l, i) => {
    const su = (l.superUser ?? l.user) as Raw | undefined;
    const co = l.company as Raw | undefined;
    return {
      id: str(l.id ?? i),
      userName: str(l.superUserName ?? su?.name ?? l.superUserId ?? "—"),
      companyId: str(l.companyId ?? co?.id),
      companyName: (l.companyName ?? co?.name ?? null) as string | null,
      action: l.action === "exit" ? "exit" : "enter",
      ip: (l.ip ?? null) as string | null,
      createdAt: str(l.createdAt),
    };
  });
}

export const impersonationLogsQuery = () =>
  queryOptions({
    queryKey: [...auditKeys.all, "impersonation"],
    queryFn: async ({ signal }) =>
      normalizeImpersonationLogs(await apiRequest<unknown>(ep.impersonationLogs, { signal })),
  });
