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
] as const;

/** Seção institucional discreta do Grupo NotasFlex, expansível e fechada por padrão. */
export function GroupFooter({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  return (
    <Collapsible open={open} onOpenChange={setOpen} className={cn("px-3 text-xs", className)}>
      <CollapsibleTrigger
        aria-label={t("group.toggle")}
        className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
      >
        <span>{t("group.title")}</span>
        <ChevronDown
          className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")}
          aria-hidden
        />
      </CollapsibleTrigger>
      <CollapsibleContent>
        <ul className="mt-1 space-y-0.5">
          {companies.map((c) => (
            <li key={c.key}>
              <a
                href={c.href}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-md px-3 py-1.5 hover:bg-sidebar-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring"
              >
                <span className="flex items-center gap-1 font-semibold text-sidebar-foreground/90">
                  {c.name}
                  <ExternalLink className="size-3 opacity-70" aria-hidden />
                  <span className="sr-only">{t("group.newTab")}</span>
                </span>
                <span className="block leading-snug text-sidebar-foreground/65">
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
