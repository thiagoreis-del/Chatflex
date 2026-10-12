export type SubscriptionStatus = "trialing" | "active" | "past_due" | "suspended" | "cancelled";
export const subscriptionStatuses: SubscriptionStatus[] = [
  "trialing",
  "active",
  "past_due",
  "suspended",
  "cancelled",
];

export interface Subscription {
  id: string;
  companyId: string;
  planId: string;
  status: SubscriptionStatus;
  billingCycle: "monthly" | "annual";
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelledAt: string | null;
  /** CONTRATO PENDENTE: campos auxiliares de exibição. */
  companyName?: string;
  planName?: string;
  nextChargeAt?: string | null;
}

export type InvoiceStatus = "open" | "paid" | "overdue" | "cancelled" | "refunded";
export const invoiceStatuses: InvoiceStatus[] = [
  "open",
  "paid",
  "overdue",
  "cancelled",
  "refunded",
];

/** Valor final sempre definido pelo backend. O frontend nunca marca fatura como paga. */
export interface Invoice {
  id: string;
  companyId: string;
  subscriptionId: string;
  amountInCents: number;
  currency: "BRL";
  status: InvoiceStatus;
  dueDate: string;
  paidAt: string | null;
  createdAt: string;
  companyName?: string;
}

export interface SubscriptionFilters {
  page: number;
  pageSize: number;
  companyId?: string | undefined;
  status?: SubscriptionStatus | undefined;
}

export interface InvoiceFilters {
  page: number;
  pageSize: number;
  companyId?: string | undefined;
  status?: InvoiceStatus | undefined;
  dueFrom?: string | undefined;
  dueTo?: string | undefined;
  createdFrom?: string | undefined;
  createdTo?: string | undefined;
}
