import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { contactsQuery } from "@/modules/contacts/api";
import { connectionsQuery } from "@/modules/whatsapp/api";
import { ticketKeys } from "@/shared/api/query-keys";
import { createTicket } from "../api";
import type { Ticket } from "../types";

/** Busca por telefone ignora pontuação: "(11) 98765-0001" → "11987650001". */
export function normalizeContactSearch(q: string): string {
  const t = q.trim();
  return /^[\d\s()+.-]+$/.test(t) ? t.replace(/\D/g, "") : t;
}

export interface NewTicketSuggestionsProps {
  search: string;
  /** IDs de contatos que já possuem atendimento aberto ou aguardando. */
  activeContactIds: Set<number>;
  userId?: number | undefined;
  onStarted: (ticket: Ticket) => void;
}

/** Lista contatos encontrados na busca que não estão em atendimento, com ação de iniciar. */
export function NewTicketSuggestions({
  search,
  activeContactIds,
  userId,
  onStarted,
}: NewTicketSuggestionsProps) {
  const { t } = useTranslation("tickets");
  const qc = useQueryClient();
  const term = normalizeContactSearch(search);
  const enabled = term.length >= 2;
  const contacts = useQuery({ ...contactsQuery({ search: term, page: 1 }), enabled });
  const connections = useQuery({ ...connectionsQuery(), enabled });
  const usable = (connections.data ?? []).filter((c) => c.status === "CONNECTED");
  const list = usable.length ? usable : (connections.data ?? []);
  const [whatsappId, setWhatsappId] = useState<string>("");
  const chosen = whatsappId || (list[0] ? String(list[0].id) : "");

  const start = useMutation({
    mutationFn: (contactId: number) =>
      createTicket({ contactId, userId, whatsappId: chosen ? Number(chosen) : undefined }),
    onSuccess: (ticket) => {
      toast.success(t("newTicket.started"));
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
      onStarted(ticket);
    },
    onError: () => toast.error(t("newTicket.error")),
  });

  if (!enabled) return null;
  const free = (contacts.data?.data ?? []).filter((c) => !activeContactIds.has(c.id));
  if (contacts.isPending) {
    return <p className="px-3 py-2 text-xs text-muted-foreground">{t("newTicket.searching")}</p>;
  }
  if (free.length === 0) return null;

  return (
    <section className="border-b bg-muted/30" aria-label={t("newTicket.title")}>
      <div className="flex items-center justify-between gap-2 px-3 pb-1 pt-2">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t("newTicket.title")}
        </h3>
        {list.length > 1 && (
          <select
            value={chosen}
            onChange={(e) => setWhatsappId(e.target.value)}
            aria-label={t("newTicket.connection")}
            className="h-7 max-w-[50%] rounded-md border bg-background px-1.5 text-xs"
          >
            {list.map((c) => (
              <option key={c.id} value={String(c.id)}>
                {c.name}
              </option>
            ))}
          </select>
        )}
      </div>
      <ul className="divide-y divide-border/60">
        {free.slice(0, 5).map((c) => {
          const name = c.name || `+${c.number}`;
          return (
            <li key={c.id} className="flex items-center gap-3 px-3 py-2">
              <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-muted font-display text-sm font-semibold uppercase text-muted-foreground">
                {name.replace(/^\+/, "").charAt(0) || "#"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{name}</p>
                <p className="truncate text-xs text-muted-foreground">+{c.number}</p>
              </div>
              <Button
                size="sm"
                variant="outline"
                className="h-8 shrink-0 gap-1"
                disabled={start.isPending}
                onClick={() => start.mutate(c.id)}
              >
                <MessageSquarePlus className="size-3.5" aria-hidden />
                {start.isPending && start.variables === c.id
                  ? t("newTicket.starting")
                  : t("newTicket.start")}
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
