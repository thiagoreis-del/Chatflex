import { forwardRef, useState, type ComponentPropsWithoutRef } from "react";
import { MessageCircle, UserRound } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { connectionsQuery } from "@/modules/whatsapp/api";
import { useSession } from "@/shared/auth/session-store";
import { contactKeys, ticketKeys } from "@/shared/api/query-keys";
import { sharedContactNumber, startSharedContactConversation } from "../shared-contact";
import type { Ticket } from "../types";
import type { ParsedVCard } from "../vcard";

export interface ContactCardProps extends ComponentPropsWithoutRef<"div"> {
  contact: ParsedVCard;
  onConversationStarted?: (ticket: Ticket) => void;
}

/** Cartão de contato compartilhado (vCard), no estilo do WhatsApp. */
export const ContactCard = forwardRef<HTMLDivElement, ContactCardProps>(function ContactCard(
  { contact, onConversationStarted, className, children, ...props }, ref,
) {
  const { t } = useTranslation("tickets");
  const session = useSession();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [chosenId, setChosenId] = useState("");
  const connections = useQuery({ ...connectionsQuery(), enabled: open });
  const usable = (connections.data ?? []).filter((item) => item.status === "CONNECTED");
  const chosen = chosenId || String(usable.find((item) => item.isDefault)?.id ?? usable[0]?.id ?? "");
  const start = useMutation({
    mutationFn: async () => {
      if (!session.user || !usable.some((item) => String(item.id) === chosen)) throw new Error("No connection");
      return startSharedContactConversation(contact, Number(chosen), Number(session.user.id));
    },
    onSuccess: (ticket) => {
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
      void qc.invalidateQueries({ queryKey: contactKeys.all });
      setOpen(false);
      onConversationStarted?.(ticket);
    },
    onError: () => toast.error(t("newTicket.error")),
  });
  const initial = (contact.name || "?").trim().charAt(0).toUpperCase();
  return (
    <div ref={ref} className={cn("min-w-0 rounded-md bg-background/60 px-3 py-2.5", className)} {...props}>
      <div className="flex items-center gap-3">
      <span
        aria-hidden
        className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/15 text-sm font-bold text-primary"
      >
        {initial || <UserRound className="size-5" />}
      </span>
      <span className="min-w-0 flex-1">
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
      {onConversationStarted && sharedContactNumber(contact.phone) && (
        <Button type="button" variant="ghost" size="sm" className="mt-2 w-full gap-2 text-primary" onClick={() => setOpen(true)}>
          <MessageCircle className="size-4" aria-hidden />
          {t("contactCard.chat")}
        </Button>
      )}
      {children}
      <Dialog open={open} onOpenChange={(value) => { if (!start.isPending) setOpen(value); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{t("contactCard.chat")}</DialogTitle>
            <DialogDescription className="[overflow-wrap:anywhere]">{contact.name} · {contact.phone}</DialogDescription>
          </DialogHeader>
          {connections.isPending ? <p role="status" className="text-sm text-muted-foreground">{t("newTicket.searching")}</p> : connections.isError ? (
            <div role="alert" className="space-y-2 text-sm text-destructive">
              <p>{t("contactCard.connectionError")}</p>
              <Button variant="outline" size="sm" onClick={() => void connections.refetch()}>{t("sidebar.refresh")}</Button>
            </div>
          ) : usable.length === 0 ? <p role="status" className="text-sm text-muted-foreground">{t("contactCard.noConnection")}</p> : (
            <div className="space-y-2">
              <Label htmlFor="shared-contact-connection">{t("newTicket.connection")}</Label>
              <select id="shared-contact-connection" value={chosen} disabled={start.isPending} onChange={(event) => setChosenId(event.target.value)} className="h-9 w-full rounded-md border bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {usable.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" disabled={start.isPending} onClick={() => setOpen(false)}>{t("transfer.cancel")}</Button>
            <Button disabled={start.isPending || connections.isError || !usable.some((item) => String(item.id) === chosen)} onClick={() => start.mutate()}>
              <MessageCircle className="size-4" aria-hidden />
              {start.isPending ? t("newTicket.starting") : t("contactCard.chat")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
});
