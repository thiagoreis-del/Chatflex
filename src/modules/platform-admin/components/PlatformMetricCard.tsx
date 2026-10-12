import type { ReactNode } from "react";
import { DataUnavailable } from "@/shared/components";
import { cn } from "@/lib/utils";

/** Exibe um indicador do backend ou "Dados indisponíveis" com o contrato pendente. */
export function PlatformMetricCard({
  label,
  icon,
  value,
  unavailable,
  contract,
  tone = "default",
}: {
  label: string;
  icon: ReactNode;
  value?: ReactNode;
  unavailable?: boolean;
  contract?: string;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <section className="rounded-xl border bg-card p-5 shadow-soft">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-sans text-sm font-medium tracking-normal text-muted-foreground">
          {label}
        </h2>
        <span
          aria-hidden
          className={cn(
            "grid size-8 place-items-center rounded-lg",
            tone === "danger"
              ? "bg-destructive/10 text-destructive"
              : tone === "warning"
                ? "bg-warning/20 text-warning-foreground"
                : "bg-secondary text-primary",
          )}
        >
          {icon}
        </span>
      </div>
      <div className="mt-3">
        {unavailable ? (
          <DataUnavailable compact contract={contract} />
        ) : (
          <p className="font-display text-3xl font-bold tabular-nums text-navy">{value}</p>
        )}
      </div>
    </section>
  );
}
