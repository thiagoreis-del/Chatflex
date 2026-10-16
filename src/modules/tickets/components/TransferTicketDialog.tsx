import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ticketKeys } from "@/shared/api/query-keys";
import { usersQuery } from "@/modules/users/api";
import { transferTicket } from "../api";
import { hideRefusedTicket, restoreRefusedTicket } from "../refused";
import type { Ticket } from "../types";
import { useSession } from "@/shared/auth/session-store";

const ANY = "any";

export function TransferTicketDialog({
  ticket,
  open,
  onOpenChange,
  onDone,
}: {
  ticket: Ticket;
  open: boolean;
  onOpenChange: (o: boolean) => void;
  onDone: (t: Ticket | null) => void;
}) {
  const { t } = useTranslation("tickets");
  const session = useSession();
  const qc = useQueryClient();
  const users = useQuery({ ...usersQuery({ search: "", page: 1 }), enabled: open });
  const [queueId] = useState<string>(ticket.queue ? String(ticket.queue.id) : "");
  const [userId, setUserId] = useState<string>(ANY);
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"forward" | "refuse">("forward");
  const refusing = mode === "refuse";

  const eligible = (users.data?.data ?? []).filter(
    (u) => !queueId || u.queueIds.includes(Number(queueId)),
  );

  const mutation = useMutation({
    mutationFn: () => {
      // Recusar oculta o ticket para o atendente que recusou, sem preencher nada.
      if (refusing) hideRefusedTicket(String(session.user?.id ?? ""), ticket.id);
      return refusing
        ? transferTicket(ticket.id, {
            ...(ticket.queue ? { queueId: ticket.queue.id } : {}),
            userId: null,
          })
        : transferTicket(ticket.id, {
            queueId: Number(queueId),
            userId: userId === ANY ? null : Number(userId),
            ...(note.trim() ? { note: note.trim() } : {}),
          });
    },
    onSuccess: (tk) => {
      toast.success(t(refusing ? "toast.refused" : "toast.transferred"));
      onDone(refusing ? null : tk);
      onOpenChange(false);
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: () => {
      if (refusing) restoreRefusedTicket(String(session.user?.id ?? ""), ticket.id);
      toast.error(t("toast.transferError"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transfer.title")}</DialogTitle>
          <DialogDescription>
            {t(refusing ? "transfer.refuseDescription" : "transfer.description")}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-lg bg-muted p-1" role="tablist">
            {(["forward", "refuse"] as const).map((m) => (
              <button
                key={m}
                type="button"
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground"}`}
              >
                {t(m === "forward" ? "transfer.forwardTab" : "transfer.refuseTab")}
              </button>
            ))}
          </div>
          {!refusing && (
          <div className="space-y-2">
            <Label>{t("transfer.user")}</Label>
            <Select value={userId} onValueChange={setUserId} disabled={!queueId}>
              <SelectTrigger aria-label={t("transfer.user")}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t("transfer.anyUser")}</SelectItem>
                {eligible.map((u) => (
                  <SelectItem key={u.id} value={String(u.id)}>
                    {u.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          )}
          {!refusing && (
            <div className="space-y-2">
              <Label htmlFor="transfer-note">{t("transfer.note")}</Label>
              <Textarea
                id="transfer-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t("transfer.notePlaceholder")}
                rows={3}
              />
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("transfer.cancel")}
          </Button>
          <Button disabled={mutation.isPending || (!refusing && !queueId)} onClick={() => mutation.mutate()}>
            {t(refusing ? "transfer.refuseSubmit" : "transfer.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
