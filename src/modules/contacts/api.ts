import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { contactKeys } from "@/shared/api/query-keys";
import { contactEndpoints as ep, withQuery } from "@/shared/config/endpoints";
import type { Paginated } from "@/shared/types/pagination";
import type { Contact, ContactInput } from "./types";

export const contactsContract = "GET /contacts";

export interface ContactFilters {
  search: string;
  page: number;
}

interface BackendContacts {
  contacts?: (Omit<Contact, "tags"> & { tags?: unknown[] })[];
  count?: number;
  data?: Contact[];
  page?: number;
  pageSize?: number;
  total?: number;
}

/** Backend: GET /contacts?searchParam&pageNumber → { contacts, count, hasMore }. */
export const contactsQuery = (filters: ContactFilters) =>
  queryOptions({
    queryKey: contactKeys.list(filters),
    queryFn: async ({ signal }): Promise<Paginated<Contact>> => {
      const res = await apiRequest<BackendContacts>(
        withQuery(ep.list, {
          ...filters,
          searchParam: filters.search,
          pageNumber: filters.page,
        }),
        { signal },
      );
      if (res.data) return res as Paginated<Contact>;
      const list = (res.contacts ?? []).map((c) => ({
        ...c,
        tags: (c.tags ?? []).map((tag) =>
          typeof tag === "string" ? tag : String((tag as { name?: string }).name ?? ""),
        ),
      })) as Contact[];
      return { data: list, page: filters.page, pageSize: 20, total: res.count ?? list.length };
    },
  });

export const createContact = (body: ContactInput) =>
  apiRequest<Contact>(ep.list, { method: "POST", body });
export const updateContact = (id: number, body: ContactInput) =>
  apiRequest<Contact>(ep.detail(id), { method: "PUT", body });
export const deleteContact = (id: number) => apiRequest<void>(ep.detail(id), { method: "DELETE" });
export const getContact = (id: number) => apiRequest<Contact>(ep.detail(id));
