import { useTranslation } from "react-i18next";
import { formatCents, formatDate } from "@/shared/format/format";

export function MoneyDisplay({
  cents,
  currency = "BRL",
}: {
  cents: number | null | undefined;
  currency?: string;
}) {
  const { t } = useTranslation();
  if (cents === null || cents === undefined)
    return <span className="text-muted-foreground">{t("states.notInformed")}</span>;
  return <span className="tabular-nums">{formatCents(cents, currency)}</span>;
}

export function DateDisplay({
  value,
  withTime = false,
}: {
  value: string | null | undefined;
  withTime?: boolean;
}) {
  const { t } = useTranslation();
  const text = formatDate(value, withTime);
  if (!text || !value)
    return <span className="text-muted-foreground">{t("states.notInformed")}</span>;
  return (
    <time dateTime={value} className="tabular-nums">
      {text}
    </time>
  );
}
