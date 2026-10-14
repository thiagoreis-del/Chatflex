import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { userKeys } from "@/shared/api/query-keys";
import { userEndpoints as ep, withQuery } from "@/shared/config/endpoints";
import type { Paginated } from "@/shared/types/pagination";
import type { CompanyUser, CompanyUserInput } from "./types";

export const usersContract = "GET /users";

export interface UserFilters {
  search: string;
  page: number;
}

interface BackendUsers extends Partial<Paginated<CompanyUser>> {
  users?: (Omit<CompanyUser, "queueIds"> & { queueIds?: number[]; queues?: { id: number }[] })[];
  count?: number;
}

/** Backend ZapPro/Whaticket: GET /users?searchParam&pageNumber → { users, count, hasMore }. */
export const usersQuery = (filters: UserFilters) =>
  queryOptions({
    queryKey: userKeys.list(filters),
    queryFn: async ({ signal }): Promise<Paginated<CompanyUser>> => {
      const res = await apiRequest<BackendUsers>(
        withQuery(ep.list, { ...filters, searchParam: filters.search, pageNumber: filters.page }),
        { signal },
      );
      if (res.data) return res as Paginated<CompanyUser>;
      const list = (res.users ?? []).map(({ queues, ...u }) => ({
        ...u,
        queueIds: u.queueIds ?? (queues ?? []).map((q) => q.id),
      }));
      return { data: list, page: filters.page, pageSize: 20, total: res.count ?? list.length };
    },
  });

export const createUser = (body: CompanyUserInput) =>
  apiRequest<CompanyUser>(ep.list, { method: "POST", body });
export const updateUser = (id: number, body: CompanyUserInput) =>
  apiRequest<CompanyUser>(ep.detail(id), { method: "PUT", body });
export const deleteUser = (id: number) => apiRequest<void>(ep.detail(id), { method: "DELETE" });
