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

/** Backend: GET /users?searchParam&pageNumber → { users, count, hasMore }. */
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

/** Seletores da empresa precisam de todas as páginas, não só dos primeiros 20 usuários. */
export const allCompanyUsersQuery = () =>
  queryOptions({
    queryKey: userKeys.list({ search: "", scope: "all" }),
    queryFn: async ({ signal }): Promise<CompanyUser[]> => {
      const users = new Map<number, CompanyUser>();
      for (let page = 1; ; page++) {
        const res = await apiRequest<BackendUsers & { hasMore?: boolean }>(
          withQuery(ep.list, { search: "", searchParam: "", page, pageNumber: page }),
          { signal },
        );
        const list = res.data ?? (res.users ?? []).map(({ queues, ...u }) => ({
          ...u,
          queueIds: u.queueIds ?? (queues ?? []).map((q) => q.id),
        }));
        const before = users.size;
        for (const user of list) users.set(user.id, user);
        const total = res.total ?? res.count;
        if (!list.length || users.size === before || res.hasMore === false ||
          (res.hasMore !== true && (total === undefined || users.size >= total))) break;
      }
      return [...users.values()].sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
    },
  });

export const createUser = (body: CompanyUserInput) =>
  apiRequest<CompanyUser>(ep.list, { method: "POST", body });
export const updateUser = (id: number, body: CompanyUserInput) =>
  apiRequest<CompanyUser>(ep.detail(id), { method: "PUT", body });
export const deleteUser = (id: number) => apiRequest<void>(ep.detail(id), { method: "DELETE" });

/** Bloqueio/desbloqueio: envia `blocked` no update (contrato pendente no backend). */
export const setUserBlocked = (u: CompanyUser, blocked: boolean) =>
  apiRequest<CompanyUser>(ep.detail(u.id), {
    method: "PUT",
    body: { name: u.name, email: u.email, profile: u.profile, queueIds: u.queueIds, blocked },
  });

/** Redefinição: grava nova senha temporária (o backend aplica o hash). */
export const resetUserPassword = (u: CompanyUser, password: string) =>
  apiRequest<CompanyUser>(ep.detail(u.id), {
    method: "PUT",
    body: { name: u.name, email: u.email, profile: u.profile, queueIds: u.queueIds, password },
  });
