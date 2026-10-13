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
import { queuesQuery } from "@/modules/queues/api";
import { usersQuery } from "@/modules/users/api";
import { transferTicket } from "../api";
import type { Ticket } from "../types";

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
  onDone: (t: Ticket) => void;
}) {
  const { t } = useTranslation("tickets");
  const qc = useQueryClient();
  const queues = useQuery({ ...queuesQuery(), enabled: open });
  const users = useQuery({ ...usersQuery({ search: "", page: 1 }), enabled: open });
  const [queueId, setQueueId] = useState<string>(ticket.queue ? String(ticket.queue.id) : "");
  const [userId, setUserId] = useState<string>(ANY);
  const [note, setNote] = useState("");

  const eligible = (users.data?.items ?? []).filter(
    (u) => !queueId || u.queueIds.includes(Number(queueId)),
  );

  const mutation = useMutation({
    mutationFn: () =>
      transferTicket(ticket.id, {
        queueId: Number(queueId),
        userId: userId === ANY ? null : Number(userId),
        note: note.trim() || undefined,
      }),
    onSuccess: (tk) => {
      toast.success(t("toast.transferred"));
      onDone(tk);
      onOpenChange(false);
      void qc.invalidateQueries({ queryKey: ticketKeys.all });
    },
    onError: () => toast.error(t("toast.transferError")),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("transfer.title")}</DialogTitle>
          <DialogDescription>{t("transfer.description")}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>{t("transfer.queue")}</Label>
            <Select
              value={queueId}
              onValueChange={(v) => {
                setQueueId(v);
                setUserId(ANY);
              }}
            >
              <SelectTrigger aria-label={t("transfer.queue")}>
                <SelectValue placeholder={t("transfer.queuePlaceholder")} />
              </SelectTrigger>
              <SelectContent>
                {(queues.data ?? []).map((q) => (
                  <SelectItem key={q.id} value={String(q.id)}>
                    <span className="inline-flex items-center gap-2">
                      <span className="size-2 rounded-full" style={{ backgroundColor: q.color }} />
                      {q.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t("transfer.cancel")}
          </Button>
          <Button disabled={!queueId || mutation.isPending} onClick={() => mutation.mutate()}>
            {t("transfer.submit")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
