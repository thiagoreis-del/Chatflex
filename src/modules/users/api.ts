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

export const usersQuery = (filters: UserFilters) =>
  queryOptions({
    queryKey: userKeys.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<Paginated<CompanyUser>>(withQuery(ep.list, filters), { signal }),
  });

export const createUser = (body: CompanyUserInput) =>
  apiRequest<CompanyUser>(ep.list, { method: "POST", body });
export const updateUser = (id: number, body: CompanyUserInput) =>
  apiRequest<CompanyUser>(ep.detail(id), { method: "PUT", body });
export const deleteUser = (id: number) => apiRequest<void>(ep.detail(id), { method: "DELETE" });
