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

export const contactsQuery = (filters: ContactFilters) =>
  queryOptions({
    queryKey: contactKeys.list(filters),
    queryFn: ({ signal }) =>
      apiRequest<Paginated<Contact>>(withQuery(ep.list, filters), { signal }),
  });

export const createContact = (body: ContactInput) =>
  apiRequest<Contact>(ep.list, { method: "POST", body });
export const updateContact = (id: number, body: ContactInput) =>
  apiRequest<Contact>(ep.detail(id), { method: "PUT", body });
export const deleteContact = (id: number) => apiRequest<void>(ep.detail(id), { method: "DELETE" });
