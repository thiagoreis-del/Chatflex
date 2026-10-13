import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatNumber } from "@/shared/format/format";

/** Uso vs. contratado — valores exclusivamente do backend. */
export function UsageProgress({
  label,
  used,
  limit,
  unit,
}: {
  label: string;
  used: number;
  limit: number;
  unit?: "mb";
}) {
  const { t } = useTranslation("platform");
  if (used < 0)
    return (
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          {t("usage.limitOnly", { limit: formatNumber(limit) })}
        </span>
      </div>
    );
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;
  const near = pct >= 85;
  const text =
    unit === "mb"
      ? t("usage.storageOf", { used: formatNumber(used), limit: formatNumber(limit) })
      : t("usage.ofLimit", { used: formatNumber(used), limit: formatNumber(limit) });
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 text-sm">
        <span className="font-medium">{label}</span>
        <span className="tabular-nums text-muted-foreground">{text}</span>
      </div>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={limit}
        aria-valuenow={used}
        aria-valuetext={text}
        className="h-2.5 overflow-hidden rounded-full bg-muted"
      >
        <div
          className={cn("h-full rounded-full transition-all", near ? "bg-warning" : "bg-primary")}
          style={{ width: `${pct}%` }}
        />
      </div>
      {near && (
        <p className="text-xs font-medium text-warning-foreground">{t("usage.nearLimit")}</p>
      )}
    </div>
  );
}
