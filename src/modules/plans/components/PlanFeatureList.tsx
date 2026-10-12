import { useTranslation } from "react-i18next";
import { Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { planFeatureKeys, type PlanFeatures } from "../types";

export function PlanFeatureList({ features, className }: { features: PlanFeatures; className?: string }) {
  const { t } = useTranslation("platform");
  return (
    <ul className={cn("grid gap-2 sm:grid-cols-2", className)}>
      {planFeatureKeys.map((k) => (
        <li key={k} className="flex items-center gap-2 text-sm">
          {features[k] ? (
            <Check className="size-4 text-success" aria-hidden />
          ) : (
            <Minus className="size-4 text-muted-foreground" aria-hidden />
          )}
          <span className={features[k] ? "" : "text-muted-foreground"}>{t(`features.${k}`)}</span>
          <span className="sr-only">: {t(features[k] ? "features.enabled" : "features.disabled")}</span>
        </li>
      ))}
    </ul>
  );
}
