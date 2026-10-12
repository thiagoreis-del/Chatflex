import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { auditKeys } from "@/shared/api/query-keys";
import { platformEndpoints as ep, withQuery } from "@/shared/config/endpoints";
import type { Paginated } from "@/shared/types/pagination";
import type { AuditEvent, AuditFilters } from "./types";

export const auditContract = "GET /platform/audit-events";

export const auditQuery = (filters: AuditFilters) =>
  queryOptions({
    queryKey: auditKeys.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<Paginated<AuditEvent>>(withQuery(ep.auditEvents, filters), { signal }),
  });
