import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import logo from "@/assets/chatbotflex-logo.png";

export function AppLogo({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <img
      src={logo}
      alt={t("logoAlt")}
      width={256}
      height={256}
      className={cn("size-8 shrink-0 object-contain", className)}
    />
  );
}

export function AppName({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <span className={cn("font-display font-bold tracking-tight", className)}>{t("appName")}</span>
  );
}
