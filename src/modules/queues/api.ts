import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { queueKeys } from "@/shared/api/query-keys";
import { queueEndpoints as ep } from "@/shared/config/endpoints";
import type { Queue, QueueInput } from "./types";

export const queuesContract = "GET /queue";

export const queuesQuery = () =>
  queryOptions({
    queryKey: queueKeys.list(),
    queryFn: ({ signal }) => apiRequest<Queue[]>(ep.list, { signal }),
  });

export const createQueue = (body: QueueInput) =>
  apiRequest<Queue>(ep.list, { method: "POST", body });
export const updateQueue = (id: number, body: QueueInput) =>
  apiRequest<Queue>(ep.detail(id), { method: "PUT", body });
export const deleteQueue = (id: number) => apiRequest<void>(ep.detail(id), { method: "DELETE" });
