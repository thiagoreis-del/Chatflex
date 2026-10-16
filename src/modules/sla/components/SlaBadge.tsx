import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { formatDuration, type SlaInfo } from "../sla";

/** Selo do SLA com cronômetro regressivo (até a violação) ou tempo excedido. */
export function SlaBadge({ info }: { info: SlaInfo }) {
  const { t } = useTranslation("settings");
  if (info.state === "none") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded px-1.5 text-[11px] font-semibold tabular-nums",
        info.state === "monitoring" && "bg-muted text-muted-foreground",
        info.state === "warning" && "bg-accent text-accent-foreground",
        info.state === "urgent" && "bg-warning text-warning-foreground",
        info.state === "violated" && "bg-destructive text-destructive-foreground",
      )}
      title={t(`sla.states.${info.state}`)}
    >
      {t(`sla.states.${info.state}`)} · {formatDuration(info.remainingMs)}
    </span>
  );
}
