import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Info, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ConfirmDialog, EmptyState, PageHeader, QueryBoundary } from "@/shared/components";
import { queueKeys } from "@/shared/api/query-keys";
import { createQueue, deleteQueue, queuesContract, queuesQuery, updateQueue } from "../api";
import type { Queue, QueueInput } from "../types";
import { isApiError } from "@/shared/api/errors";

export function QueuesPage() {
  const { t } = useTranslation("team");
  const qc = useQueryClient();
  const query = useQuery(queuesQuery());
  const [form, setForm] = useState<Queue | "new" | null>(null);
  const [toDelete, setToDelete] = useState<Queue | null>(null);

  const invalidate = () => qc.invalidateQueries({ queryKey: ["company"] });
  const remove = useMutation({
    mutationFn: deleteQueue,
    onSuccess: () => {
      toast.success(t("toast.deleted"));
      void invalidate();
    },
    onError: () => toast.error(t("toast.error")),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("queues.title")}
        description={t("queues.description")}
        actions={
          <Button onClick={() => setForm("new")}>
            <Plus className="size-4" aria-hidden />
            {t("queues.new")}
          </Button>
        }
      />
      <p className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
        <Info className="size-4 shrink-0" aria-hidden />
        {t("pending")}
      </p>
      <QueryBoundary query={query} contract={queuesContract}>
        {(list) =>
          list.length === 0 ? (
            <EmptyState title={t("queues.empty")} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("queues.table.name")}</TableHead>
                  <TableHead>{t("queues.table.greeting")}</TableHead>
                  <TableHead className="w-24 text-right">{t("queues.table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((q) => (
                  <TableRow key={q.id}>
                    <TableCell className="font-medium">
                      <span className="flex items-center gap-2">
                        <span
                          className="size-3 rounded-full border"
                          style={{ backgroundColor: q.color }}
                          aria-hidden
                        />
                        {q.name}
                      </span>
                    </TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {q.greetingMessage || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("actions.edit")}
                        onClick={() => setForm(q)}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("actions.delete")}
                        onClick={() => setToDelete(q)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        }
      </QueryBoundary>
      {form && <QueueFormDialog value={form} onClose={() => setForm(null)} onSaved={invalidate} />}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("queues.confirmDelete.title")}
        description={t("queues.confirmDelete.description", { name: toDelete?.name })}
        confirmLabel={t("actions.delete")}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </div>
  );
}

function QueueFormDialog({
  value,
  onClose,
  onSaved,
}: {
  value: Queue | "new";
  onClose: () => void;
  onSaved: () => unknown;
}) {
  const { t } = useTranslation("team");
  const editing = value !== "new" ? value : null;
  const [data, setData] = useState<QueueInput>({
    name: editing?.name ?? "",
    color: editing?.color ?? "#2563EB",
    greetingMessage: editing?.greetingMessage ?? "",
  });
  const [nameError, setNameError] = useState(false);
  const save = useMutation({
    mutationFn: () => {
      const body = {
        ...data,
        name: data.name.trim(),
        greetingMessage: data.greetingMessage.trim(),
      };
      return editing ? updateQueue(editing.id, body) : createQueue(body);
    },
    onSuccess: () => {
      toast.success(t("toast.saved"));
      void onSaved();
      onClose();
    },
    onError: (err) => {
      const b = isApiError(err) ? (err.body as { message?: string; code?: string; error?: string } | undefined) : undefined;
      const raw = b?.error || b?.message || b?.code;
      const msg = raw?.includes("COLOR") ? t("queues.form.colorTaken") : raw?.includes("NAME") ? t("queues.form.nameTaken") : raw;
      toast.error(msg ? `${t("toast.error")} ${msg}` : t("toast.error"));
    },
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const invalid = !data.name.trim();
            setNameError(invalid);
            if (!invalid) save.mutate();
          }}
        >
          <DialogHeader>
            <DialogTitle>{editing ? t("queues.edit") : t("queues.new")}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-[1fr_auto] gap-3">
            <div className="space-y-2">
              <Label htmlFor="q-name">{t("queues.form.name")}</Label>
              <Input
                id="q-name"
                value={data.name}
                aria-invalid={nameError}
                onChange={(e) => setData({ ...data, name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="q-color">{t("queues.form.color")}</Label>
              <Input
                id="q-color"
                type="color"
                className="h-9 w-16 p-1"
                value={data.color}
                onChange={(e) => setData({ ...data, color: e.target.value })}
              />
            </div>
          </div>
          {nameError && <p className="text-xs text-destructive">{t("queues.form.nameRequired")}</p>}
          <div className="space-y-2">
            <Label htmlFor="q-greeting">{t("queues.form.greeting")}</Label>
            <Textarea
              id="q-greeting"
              rows={3}
              value={data.greetingMessage}
              onChange={(e) => setData({ ...data, greetingMessage: e.target.value })}
            />
            <p className="text-xs text-muted-foreground">{t("queues.form.greetingHint")}</p>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              {t("actions.cancel")}
            </Button>
            <Button type="submit" disabled={save.isPending}>
              {t("actions.save")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
