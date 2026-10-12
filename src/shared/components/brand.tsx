import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

export function AppLogo({ className }: { className?: string }) {
  const { t } = useTranslation();
  return (
    <svg
      viewBox="0 0 32 32"
      role="img"
      aria-label={t("logoAlt")}
      className={cn("size-8 shrink-0", className)}
    >
      <rect width="32" height="32" rx="9" className="fill-primary" />
      <path
        d="M9 11.5A3.5 3.5 0 0 1 12.5 8h7A3.5 3.5 0 0 1 23 11.5v5a3.5 3.5 0 0 1-3.5 3.5H15l-4.2 3.4c-.5.4-1.3 0-1.3-.6V20.2A3.5 3.5 0 0 1 9 17z"
        className="fill-primary-foreground"
      />
      <circle cx="21.5" cy="10" r="3.2" className="fill-warning" />
    </svg>
  );
}

export function AppName({ className }: { className?: string }) {
  const { t } = useTranslation();
  return <span className={cn("font-display font-bold tracking-tight", className)}>{t("appName")}</span>;
}
