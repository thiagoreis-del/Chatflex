import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { queueKeys } from "@/shared/api/query-keys";
import { queueEndpoints as ep } from "@/shared/config/endpoints";
import type { Queue, QueueInput } from "./types";
import { queuePayload } from "./contract";

export const queuesContract = "GET /queue";

export const queuesQuery = () =>
  queryOptions({
    queryKey: queueKeys.list(),
    queryFn: ({ signal }) => apiRequest<Queue[]>(ep.list, { signal }),
  });

export const createQueue = (body: QueueInput) =>
  apiRequest<Queue>(ep.list, { method: "POST", body: queuePayload(body) });
export const updateQueue = async (id: number, body: QueueInput) => {
  // Read the full record before updating so hidden router/schedule settings are preserved.
  const existing = await apiRequest<Queue>(ep.detail(id));
  return apiRequest<Queue>(ep.detail(id), { method: "PUT", body: queuePayload(body, existing) });
};
export const deleteQueue = (id: number) => apiRequest<void>(ep.detail(id), { method: "DELETE" });
