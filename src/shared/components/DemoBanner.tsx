import { useTranslation } from "react-i18next";
import { env } from "@/shared/config/env";

export function DemoBanner() {
  const { t } = useTranslation();
  if (!env.useMocks) return null;
  return (
    <div role="note" className="bg-warning px-4 py-1.5 text-center text-sm font-medium text-warning-foreground">
      {t("demoBanner")}
    </div>
  );
}
