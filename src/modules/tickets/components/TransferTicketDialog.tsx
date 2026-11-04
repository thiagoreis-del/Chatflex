import { useEffect, useState } from "react";
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
import { allCompanyUsersQuery } from "@/modules/users/api";
import { queuesQuery } from "@/modules/queues/api";
import { transferTicket, updateTicketStatus } from "../api";
import type { Ticket } from "../types";

const ANY = "any";
const NO_QUEUE = "none";

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
  const qc = useQueryClient();
  const users = useQuery({ ...allCompanyUsersQuery(), enabled: open });
  const queues = useQuery({ ...queuesQuery(), enabled: open });
  const initialQueueId = ticket.queue ? String(ticket.queue.id) : NO_QUEUE;
  const [queueId, setQueueId] = useState<string>(initialQueueId);
  const [userId, setUserId] = useState<string>(ANY);
  const [note, setNote] = useState("");
  const [mode, setMode] = useState<"forward" | "refuse">("forward");
  const refusing = mode === "refuse";

  useEffect(() => {
    if (!open) return;
    setQueueId(initialQueueId);
    setUserId(ANY);
    setNote("");
    setMode("forward");
  }, [initialQueueId, open, ticket.id]);

  const eligible = (users.data ?? []).filter(
    (u) => !u.blocked && (queueId === NO_QUEUE || u.queueIds.includes(Number(queueId))),
  );
  const selectedUser = eligible.find((u) => String(u.id) === userId);
  const selectedQueue = (queues.data ?? []).find((q) => String(q.id) === queueId);

  const mutation = useMutation({
    mutationFn: () => {
      // Recusar altera somente o status, preservando contato, responsável e histórico.
      if (refusing) {
        return updateTicketStatus(ticket.id, "closed");
      }
      return transferTicket(ticket.id, {
        ...(queueId === NO_QUEUE ? {} : { queueId: Number(queueId) }),
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
              <Label>{t("transfer.queue")}</Label>
              <Select
                value={queueId}
                onValueChange={(value) => {
                  setQueueId(value);
                  setUserId(ANY);
                }}
              >
                <SelectTrigger aria-label={t("transfer.queue")}>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NO_QUEUE}>{t("transfer.noQueue")}</SelectItem>
                  {(queues.data ?? []).map((queue) => (
                    <SelectItem key={queue.id} value={String(queue.id)}>
                      {queue.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          {!refusing && (
            <div className="space-y-2">
              <Label>{t("transfer.user")}</Label>
              <Select value={userId} onValueChange={setUserId}>
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
              {eligible.length === 0 && (
                <p className="text-xs text-destructive">{t("transfer.noEligibleUsers")}</p>
              )}
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
          {!refusing && (
            <div className="rounded-lg border bg-muted/40 px-3 py-2 text-sm">
              <span className="text-muted-foreground">{t("transfer.destination")}: </span>
              <strong>
                {selectedUser?.name ?? t("transfer.anyUser")}
                {selectedQueue ? ` · ${selectedQueue.name}` : ` · ${t("transfer.noQueue")}`}
              </strong>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("transfer.cancel")}
          </Button>
          <Button
            disabled={mutation.isPending || (!refusing && userId === ANY && eligible.length === 0)}
            onClick={() => mutation.mutate()}
          >
            {t(refusing ? "transfer.refuseSubmit" : "transfer.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
