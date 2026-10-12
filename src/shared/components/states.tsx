import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { AlertTriangle, Inbox, Loader2, ShieldOff, CloudOff, Plug } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex gap-2">{actions}</div>}
    </header>
  );
}

export function LoadingState({ label, className }: { label?: string; className?: string }) {
  const { t } = useTranslation();
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn("flex items-center justify-center gap-2 p-8 text-muted-foreground", className)}
    >
      <Loader2 className="size-5 animate-spin" aria-hidden />
      <span>{label ?? t("states.loading")}</span>
    </div>
  );
}

function StateShell({
  icon,
  title,
  description,
  action,
  tone = "muted",
  className,
}: {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "muted" | "danger" | "warning";
  className?: string;
}) {
  const toneCls = {
    muted: "bg-muted text-muted-foreground",
    danger: "bg-destructive/10 text-destructive",
    warning: "bg-warning/20 text-warning-foreground",
  }[tone];
  return (
    <section
      className={cn("mx-auto flex max-w-md flex-col items-center gap-3 p-8 text-center", className)}
    >
      <div className={cn("grid size-12 place-items-center rounded-2xl", toneCls)} aria-hidden>
        {icon}
      </div>
      <h2 className="text-lg font-semibold">{title}</h2>
      {description && <p className="text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-2 flex flex-wrap justify-center gap-2">{action}</div>}
    </section>
  );
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title?: string;
  description?: string;
  action?: ReactNode;
}) {
  const { t } = useTranslation();
  return (
    <StateShell
      icon={<Inbox className="size-6" />}
      title={title ?? t("states.empty")}
      description={description}
      action={action}
    />
  );
}

export function ErrorState({
  title,
  description,
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  const { t } = useTranslation(["errors", "common"]);
  return (
    <StateShell
      tone="danger"
      icon={<AlertTriangle className="size-6" />}
      title={title ?? t("errors:generic.title")}
      description={description ?? t("errors:generic.description")}
      action={onRetry && <Button onClick={onRetry}>{t("common:actions.retry")}</Button>}
    />
  );
}

export function AccessDenied({ className }: { className?: string }) {
  const { t } = useTranslation(["errors", "common"]);
  return (
    <StateShell
      className={className}
      tone="warning"
      icon={<ShieldOff className="size-6" />}
      title={t("errors:403.title")}
      description={t("errors:403.description")}
      action={
        <Button asChild variant="outline">
          <Link to="/">{t("common:actions.backHome")}</Link>
        </Button>
      }
    />
  );
}

export function BackendUnavailable({
  onRetry,
  className,
}: {
  onRetry?: () => void;
  className?: string;
}) {
  const { t } = useTranslation(["errors", "common"]);
  return (
    <StateShell
      className={className}
      tone="danger"
      icon={<CloudOff className="size-6" />}
      title={t("errors:unavailable.title")}
      description={t("errors:unavailable.description")}
      action={onRetry && <Button onClick={onRetry}>{t("common:actions.retry")}</Button>}
    />
  );
}

export function PendingIntegration({ className }: { className?: string }) {
  const { t } = useTranslation("errors");
  return (
    <StateShell
      className={className}
      icon={<Plug className="size-6" />}
      title={t("pending.title")}
      description={t("pending.description")}
    />
  );
}
