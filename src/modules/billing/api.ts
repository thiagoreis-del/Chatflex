import { queryOptions } from "@tanstack/react-query";
import { apiRequest } from "@/shared/api/client";
import { invoiceKeys, subscriptionKeys } from "@/shared/api/query-keys";
import { platformEndpoints as ep, withQuery } from "@/shared/config/endpoints";
import type { Paginated } from "@/shared/types/pagination";
import type { Invoice, InvoiceFilters, Subscription, SubscriptionFilters } from "./types";

export const billingContracts = { subscriptions: "GET /platform/subscriptions", invoices: "GET /platform/invoices" };

export const subscriptionsQuery = (filters: SubscriptionFilters) =>
  queryOptions({
    queryKey: subscriptionKeys.list(filters),
    queryFn: ({ signal }) => apiRequest<Paginated<Subscription>>(withQuery(ep.subscriptions, filters), { signal }),
  });

export const invoicesQuery = (filters: InvoiceFilters) =>
  queryOptions({
    queryKey: invoiceKeys.list(filters),
    queryFn: ({ signal }) => apiRequest<Paginated<Invoice>>(withQuery(ep.invoices, filters), { signal }),
  });
