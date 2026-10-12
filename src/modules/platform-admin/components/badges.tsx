import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import type { CompanyStatus } from "@/modules/companies/types";
import type { InvoiceStatus, SubscriptionStatus } from "@/modules/billing/types";
import type { AuditResult } from "@/modules/audit/types";

type Tone = "success" | "warning" | "danger" | "info" | "muted";
const toneCls: Record<Tone, string> = {
  success: "bg-success/12 text-success border-success/25",
  warning: "bg-warning/18 text-warning-foreground border-warning/40",
  danger: "bg-destructive/10 text-destructive border-destructive/25",
  info: "bg-secondary text-secondary-foreground border-primary/20",
  muted: "bg-muted text-muted-foreground border-border",
};

function StatusPill({ tone, label }: { tone: Tone; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-semibold",
        toneCls[tone],
      )}
    >
      <span className="size-1.5 rounded-full bg-current" aria-hidden />
      {label}
    </span>
  );
}

const companyTone: Record<CompanyStatus, Tone> = {
  active: "success",
  trial: "info",
  onboarding: "info",
  overdue: "warning",
  suspended: "danger",
  cancelled: "muted",
};
export function CompanyStatusBadge({ status }: { status: CompanyStatus }) {
  const { t } = useTranslation("platform");
  return <StatusPill tone={companyTone[status]} label={t(`companyStatus.${status}`)} />;
}

const subTone: Record<SubscriptionStatus, Tone> = {
  active: "success",
  trialing: "info",
  past_due: "warning",
  suspended: "danger",
  cancelled: "muted",
};
export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  const { t } = useTranslation("platform");
  return <StatusPill tone={subTone[status]} label={t(`subscriptionStatus.${status}`)} />;
}

const invTone: Record<InvoiceStatus, Tone> = {
  paid: "success",
  open: "info",
  overdue: "warning",
  cancelled: "muted",
  refunded: "muted",
};
export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  const { t } = useTranslation("platform");
  return <StatusPill tone={invTone[status]} label={t(`invoiceStatus.${status}`)} />;
}

const auditTone: Record<AuditResult, Tone> = {
  success: "success",
  failure: "danger",
  denied: "warning",
};
export function AuditResultBadge({ result }: { result: AuditResult }) {
  const { t } = useTranslation("platform");
  return <StatusPill tone={auditTone[result]} label={t(`auditResult.${result}`)} />;
}
