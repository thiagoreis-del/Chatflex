import { UserRound } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ParsedVCard } from "../vcard";

/** Cartão de contato compartilhado (vCard), no estilo do WhatsApp. */
export function ContactCard({ contact }: { contact: ParsedVCard }) {
  const { t } = useTranslation("tickets");
  const initial = (contact.name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="flex min-w-52 items-center gap-3 rounded-md bg-background/60 px-3 py-2.5">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary"
      >
        {initial || <UserRound className="size-5" />}
      </span>
      <span className="min-w-0">
        <span className="block truncate text-sm font-semibold text-foreground">
          {contact.name}
        </span>
        {contact.phone && (
          <span className="block truncate text-xs text-muted-foreground">
            {contact.phone}
          </span>
        )}
        <span className="mt-0.5 block text-[10px] font-medium uppercase tracking-wide text-muted-foreground/80">
          {t("contactCard.label")}
        </span>
      </span>
    </div>
  );
}
