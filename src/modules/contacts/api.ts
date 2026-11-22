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
  hasMore?: boolean;
}

/** Backend: GET /contacts?searchParam&pageNumber → { contacts, count, hasMore }. */
export const contactsQuery = (filters: ContactFilters) =>
  queryOptions({
    queryKey: contactKeys.list(filters),
    queryFn: async ({ signal }): Promise<Paginated<Contact> & { hasMore?: boolean }> => {
      const res = await apiRequest<BackendContacts>(
        withQuery(ep.list, {
          ...filters,
          searchParam: filters.search,
          pageNumber: filters.page,
        }),
        { signal },
      );
      if (res.data) return res as Paginated<Contact> & { hasMore?: boolean };
      const list = (res.contacts ?? []).map((c) => ({
        ...c,
        tags: (c.tags ?? []).map((tag) =>
          typeof tag === "string" ? tag : String((tag as { name?: string }).name ?? ""),
        ),
      })) as Contact[];
      return {
        data: list,
        page: filters.page,
        pageSize: 20,
        total: res.count ?? list.length,
        ...(typeof res.hasMore === "boolean" && { hasMore: res.hasMore }),
      };
    },
  });

export const createContact = (body: ContactInput) =>
  apiRequest<Contact>(ep.list, { method: "POST", body });
export const updateContact = (id: number, body: ContactInput) =>
  apiRequest<Contact>(ep.detail(id), { method: "PUT", body });
export const deleteContact = (id: number) => apiRequest<void>(ep.detail(id), { method: "DELETE" });
export const getContact = (id: number) => apiRequest<Contact>(ep.detail(id));
export const refreshContactProfilePicture = (id: number) =>
  apiRequest<{
    contactId: number;
    profilePicUrl: string;
    status?: "updated" | "unavailable" | "disconnected" | "retry";
  }>(ep.refreshProfilePicture(id), { method: "POST" });

export type PhotoBatchMode = "missing" | "all";
interface PhotoBatch {
  id: string;
  mode: PhotoBatchMode;
  status: "running" | "stopping" | "stopped" | "completed" | "failed" | "disconnected";
  total: number | null;
  processed: number;
  updated: number;
  unavailable: number;
  failed: number;
  skipped: number;
}

interface PhotoBatchResponse {
  batch: PhotoBatch | null;
}

export const contactPhotoBatchQuery = () =>
  queryOptions({
    queryKey: contactKeys.photoBatch(),
    queryFn: ({ signal }) => apiRequest<PhotoBatchResponse>(ep.photoBatch, { signal }),
    refetchInterval: ({ state }) => {
      const status = state.data?.batch?.status;
      return status === "running" || status === "stopping" ? 4000 : false;
    },
  });

export const startContactPhotoBatch = (mode: PhotoBatchMode) =>
  apiRequest<PhotoBatchResponse>(ep.photoBatch, { method: "POST", body: { mode } });

export const stopContactPhotoBatch = (id: string) =>
  apiRequest<PhotoBatchResponse>(ep.stopPhotoBatch(id), { method: "POST" });
