import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { UserRound } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { contactsQuery } from "@/modules/contacts/api";
import type { Contact } from "@/modules/contacts/types";

/** Monta o texto do cartão de contato (contrato de vCard no backend ainda pendente). */
export function contactCardText(c: Pick<Contact, "name" | "number">) {
  const digits = c.number.replace(/\D/g, "");
  return `👤 *${c.name}*\n📞 +${digits}\nhttps://wa.me/${digits}`;
}

interface ShareContactDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onPick: (contact: Contact) => void;
}

export function ShareContactDialog({ open, onOpenChange, onPick }: ShareContactDialogProps) {
  const { t } = useTranslation("tickets");
  const [q, setQ] = useState("");
  const [search, setSearch] = useState("");
  useEffect(() => {
    const id = setTimeout(() => setSearch(q.trim()), 300);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => {
    if (!open) setQ("");
  }, [open]);
  const list = useQuery({ ...contactsQuery({ search, page: 1 }), enabled: open });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("shareContact.title")}</DialogTitle>
          <DialogDescription>{t("shareContact.description")}</DialogDescription>
        </DialogHeader>
        <Input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
        />
        <ul className="max-h-72 overflow-y-auto divide-y">
          {list.isLoading && (
            <li className="p-3 text-sm text-muted-foreground">{t("newTicket.searching")}</li>
          )}
          {list.data?.data.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">{t("shareContact.empty")}</li>
          )}
          {list.data?.data.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                className="flex w-full items-center gap-3 p-3 text-left hover:bg-muted focus-visible:bg-muted focus-visible:outline-none"
                onClick={() => onPick(c)}
              >
                <UserRound className="size-4 text-primary" />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{c.name}</span>
                  <span className="block text-xs text-muted-foreground">{c.number}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
