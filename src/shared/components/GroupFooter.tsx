import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown, ExternalLink } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";

const companies = [
  { key: "notasflex", name: "NotasFlex", href: "https://notasflex.com.br/" },
  { key: "pontoflex", name: "PontoFlex Digital", href: "https://www.pontoflexdigital.com.br/" },
  { key: "chatbotflex", name: "ChatbotFlex", href: "https://chatbotflex.com.br/" },
  { key: "avisaconta", name: "AvisaConta", href: "https://avisaconta.com.br/" },
  { key: "comprasflex", name: "ComprasFlex", href: "https://comprasflex.com.br/" },
] as const;

/**
 * Seção institucional discreta do Grupo NotasFlex, expansível e fechada por padrão.
 * variant="sidebar": uso na navegação lateral; variant="footer": uso no rodapé da página.
 */
export function GroupFooter({
  className,
  variant = "sidebar",
}: {
  className?: string;
  variant?: "sidebar" | "footer";
}) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const footer = variant === "footer";
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn(footer ? "mx-auto w-full max-w-6xl text-xs" : "px-3 text-xs", className)}>
      <CollapsibleTrigger
        aria-label={t("group.toggle")}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
          footer
            ? "text-muted-foreground hover:bg-muted/60 hover:text-foreground focus-visible:ring-ring"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
        )}
      >
        <span>{t("group.title")}</span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className={cn("space-y-0.5", footer ? "mt-2 columns-1 gap-6 sm:columns-2 lg:columns-3" : "mt-1")}>
          {companies.map((c) => (
            <li key={c.key} className="break-inside-avoid">
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                  "block rounded-md px-3 py-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring",
                  footer
                    ? "hover:bg-muted/60 focus-visible:ring-ring"
                    : "hover:bg-sidebar-accent",
                )}
              >
                <span
                  className={cn(
                    "flex items-center gap-1 font-semibold",
                    footer ? "text-foreground/85" : "text-sidebar-foreground/90",
                  )}
                >
                  {c.name}
                  <ExternalLink className="size-3 opacity-70" aria-hidden />
                  <span className="sr-only">{t("group.newTab")}</span>
                </span>
                <span
                  className={cn(
                    "block leading-snug",
                    footer ? "text-muted-foreground" : "text-sidebar-foreground/65",
                  )}
                >
                  {t(`group.companies.${c.key}`)}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
