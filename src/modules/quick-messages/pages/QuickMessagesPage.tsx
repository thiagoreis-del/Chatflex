import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Pencil, Plus, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
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
import { quickMessageKeys } from "@/shared/api/query-keys";
import {
  createQuickMessage,
  deleteQuickMessage,
  normalizeShortcode,
  quickMessagesContract,
  quickMessagesQuery,
  updateQuickMessage,
} from "../api";
import { filterQuickMessages } from "../components/QuickMessagePicker";
import type { QuickMessage, QuickMessageInput } from "../types";
import { useSession } from "@/shared/auth/session-store";
import { ClosingMessageCard } from "@/modules/settings/ClosingMessageCard";

export function QuickMessagesPage() {
  const { t } = useTranslation("quickMessages");
  const role = useSession().user?.role;
  const companyId = useSession().user?.companyId;
  const isAdmin = role === "superadmin" || role === "company_admin";
  const qc = useQueryClient();
  const query = useQuery(quickMessagesQuery(companyId));
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<QuickMessage | "new" | null>(null);
  const [toDelete, setToDelete] = useState<QuickMessage | null>(null);
  const invalidate = () => qc.invalidateQueries({ queryKey: quickMessageKeys.all });
  const remove = useMutation({
    mutationFn: deleteQuickMessage,
    onSuccess: () => {
      toast.success(t("toast.deleted"));
      void invalidate();
    },
    onError: () => toast.error(t("toast.error")),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          <Button onClick={() => setForm("new")}>
            <Plus className="size-4" aria-hidden />
            {t("new")}
          </Button>
        }
      />
      {isAdmin && <ClosingMessageCard />}
      <div className="relative max-w-sm">
        <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground" aria-hidden />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("search")}
          aria-label={t("search")}
          className="pl-8"
        />
      </div>
      <QueryBoundary query={query} contract={quickMessagesContract}>
        {(all) => {
          const list = filterQuickMessages(all, normalizeShortcode(search) || "");
          return list.length === 0 ? (
            <EmptyState title={t("empty")} />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-40">{t("table.shortcode")}</TableHead>
                  <TableHead>{t("table.message")}</TableHead>
                  <TableHead className="w-40">{t("table.scope")}</TableHead>
                  <TableHead className="w-24 text-right">{t("table.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {list.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="font-semibold text-primary">/{m.shortcode}</TableCell>
                    <TableCell className="max-w-md truncate text-muted-foreground">
                      {m.message}
                    </TableCell>
                    <TableCell className="text-sm">
                      {m.geral ? t("scope.all") : t("scope.mine")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("actions.edit")}
                        onClick={() => setForm(m)}
                      >
                        <Pencil className="size-4" aria-hidden />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        aria-label={t("actions.delete")}
                        onClick={() => setToDelete(m)}
                      >
                        <Trash2 className="size-4" aria-hidden />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          );
        }}
      </QueryBoundary>
      {form && (
        <QuickMessageFormDialog value={form} onClose={() => setForm(null)} onSaved={invalidate} />
      )}
      <ConfirmDialog
        open={!!toDelete}
        onOpenChange={(o) => !o && setToDelete(null)}
        title={t("confirmDelete.title")}
        description={t("confirmDelete.description", { name: toDelete?.shortcode })}
        confirmLabel={t("actions.delete")}
        onConfirm={() => toDelete && remove.mutate(toDelete.id)}
      />
    </div>
  );
}

const SHORTCODE_RE = /^[a-z0-9_-]{2,30}$/;

function QuickMessageFormDialog({
  value,
  onClose,
  onSaved,
}: {
  value: QuickMessage | "new";
  onClose: () => void;
  onSaved: () => unknown;
}) {
  const { t } = useTranslation("quickMessages");
  const editing = value !== "new" ? value : null;
  const [data, setData] = useState<QuickMessageInput>({
    shortcode: editing?.shortcode ?? "",
    message: editing?.message ?? "",
    geral: editing?.geral ?? true,
  });
  const [errors, setErrors] = useState({ shortcode: false, message: false });
  const save = useMutation({
    mutationFn: (body: QuickMessageInput) =>
      editing ? updateQuickMessage(editing.id, body) : createQuickMessage(body),
    onSuccess: () => {
      toast.success(t("toast.saved"));
      void onSaved();
      onClose();
    },
    onError: () => toast.error(t("toast.error")),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            const body = {
              ...data,
              shortcode: normalizeShortcode(data.shortcode),
              message: data.message.trim(),
            };
            const next = { shortcode: !SHORTCODE_RE.test(body.shortcode), message: !body.message };
            setErrors(next);
            if (!next.shortcode && !next.message) save.mutate(body);
          }}
        >
          <DialogHeader>
            <DialogTitle>{editing ? t("edit") : t("new")}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="qm-code">{t("form.shortcode")}</Label>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-muted-foreground">/</span>
              <Input
                id="qm-code"
                value={data.shortcode}
                aria-invalid={errors.shortcode}
                onChange={(e) => setData({ ...data, shortcode: e.target.value })}
              />
            </div>
            <p
              className={
                errors.shortcode ? "text-xs text-destructive" : "text-xs text-muted-foreground"
              }
            >
              {errors.shortcode ? t("form.shortcodeInvalid") : t("form.shortcodeHint")}
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="qm-message">{t("form.message")}</Label>
            <Textarea
              id="qm-message"
              rows={4}
              value={data.message}
              aria-invalid={errors.message}
              onChange={(e) => setData({ ...data, message: e.target.value })}
            />
            {errors.message && (
              <p className="text-xs text-destructive">{t("form.messageRequired")}</p>
            )}
          </div>
          <div className="flex items-center gap-3">
            <Switch
              id="qm-geral"
              checked={data.geral}
              onCheckedChange={(geral) => setData({ ...data, geral })}
            />
            <Label htmlFor="qm-geral">{t("form.geral")}</Label>
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
