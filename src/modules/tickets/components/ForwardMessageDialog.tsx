import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { forwardMessage, ticketsQuery } from "../api";
import type { Message } from "../types";

export interface ForwardMessageDialogProps {
  message: Message | null;
  currentTicketId: number;
  onClose: () => void;
}

/** Escolhe um atendimento aberto e reenvia a mensagem selecionada. */
export function ForwardMessageDialog({ message, currentTicketId, onClose }: ForwardMessageDialogProps) {
  const { t } = useTranslation("tickets");
  const [search, setSearch] = useState("");
  const list = useQuery({ ...ticketsQuery({ status: "open", search }), enabled: !!message });
  const send = useMutation({
    mutationFn: (ticketId: number) => forwardMessage(message!, ticketId),
    onSuccess: () => {
      toast.success(t("forward.done"));
      onClose();
    },
    onError: () => toast.error(t("forward.failed")),
  });
  const tickets = (list.data ?? []).filter((x) => x.id !== currentTicketId);

  return (
    <Dialog open={!!message} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{t("forward.title")}</DialogTitle>
        </DialogHeader>
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("forward.search")}
          aria-label={t("forward.search")}
        />
        <ul className="max-h-80 overflow-y-auto">
          {list.isLoading && <li className="p-3 text-sm text-muted-foreground">{t("forward.loading")}</li>}
          {!list.isLoading && tickets.length === 0 && (
            <li className="p-3 text-sm text-muted-foreground">{t("forward.empty")}</li>
          )}
          {tickets.map((tk) => (
            <li key={tk.id}>
              <button
                type="button"
                disabled={send.isPending}
                onClick={() => send.mutate(tk.id)}
                className="flex w-full flex-col items-start rounded-md px-3 py-2 text-left hover:bg-muted focus-visible:bg-muted disabled:opacity-50"
              >
                <span className="truncate text-sm font-medium">{tk.contact?.name}</span>
                <span className="truncate text-xs text-muted-foreground">{tk.contact?.number}</span>
              </button>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}
